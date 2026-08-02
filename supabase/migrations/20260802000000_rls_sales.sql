-- Fecha o acesso público à tabela de vendas.
--
-- Situação antes desta migration: a role `anon` (cuja chave vai compilada dentro
-- do JS do dashboard, ou seja, é pública por natureza) tinha SELECT e INSERT em
-- `sales` e nas duas views. Qualquer pessoa com a chave conseguia baixar as 172
-- vendas — clientes, valores, custos e margens — e ainda inserir vendas falsas.
--
-- Depois desta migration:
--   - `anon`         : nenhum acesso. Sem login, o dashboard não lê nada.
--   - `authenticated`: somente leitura.
--   - `service_role` : acesso total (ignora RLS por definição) — é a role que a
--                      integração do ERP/n8n deve usar para gravar.
--
-- ATENÇÃO ANTES DE RODAR: se a integração que alimenta a tabela hoje usa a chave
-- anon, ela vai parar de gravar. Troque para a chave `service_role` antes.

begin;

-- ---------------------------------------------------------------------------
-- 1. Liga RLS. Sem nenhuma policy, isso já bloqueia tudo por padrão.
-- ---------------------------------------------------------------------------
alter table public.sales enable row level security;

-- Impede que o dono da tabela escape do RLS sem querer.
alter table public.sales force row level security;

-- ---------------------------------------------------------------------------
-- 2. Tira os grants do anon. RLS sozinho não basta: o grant de INSERT é o que
--    permitia a inserção de vendas falsas.
-- ---------------------------------------------------------------------------
revoke all on public.sales from anon;
revoke all on public.sales_by_customer from anon;
revoke all on public.sales_daily from anon;

-- ---------------------------------------------------------------------------
-- 3. Usuário logado: leitura e nada mais. Sem INSERT/UPDATE/DELETE — o
--    dashboard só consulta; quem grava é o ERP via service_role.
-- ---------------------------------------------------------------------------
grant select on public.sales to authenticated;
grant select on public.sales_by_customer to authenticated;
grant select on public.sales_daily to authenticated;

drop policy if exists "leitura para usuarios autenticados" on public.sales;
create policy "leitura para usuarios autenticados"
  on public.sales
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. As views precisam rodar com a permissão de quem consulta, não com a do
--    dono. Sem isso elas continuariam devolvendo os dados por cima do RLS.
--    Requer PostgreSQL 15+.
-- ---------------------------------------------------------------------------
alter view public.sales_by_customer set (security_invoker = on);
alter view public.sales_daily set (security_invoker = on);

commit;

-- ---------------------------------------------------------------------------
-- Conferência — rode depois de aplicar.
--
--   select relname, relrowsecurity, relforcerowsecurity
--     from pg_class where relname = 'sales';
--   -- esperado: t | t
--
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name in ('sales','sales_by_customer','sales_daily')
--      and grantee in ('anon','authenticated') order by grantee;
--   -- esperado: nenhuma linha de anon; só SELECT para authenticated
--
--   select policyname, cmd, roles from pg_policies where tablename = 'sales';
--   -- esperado: 1 policy, SELECT, {authenticated}
-- ---------------------------------------------------------------------------
