-- =========================================================================
-- Esquema do Índice Geopolítico Africano
--
-- Substitui o ficheiro público/dados/relatorios.json. A diferença que motiva
-- a mudança não é o formato: é o histórico. Cada geração acrescenta uma linha
-- em vez de substituir a anterior, o que torna possível traçar a evolução da
-- classificação de um país ao longo do tempo.
--
-- Aplicar:  psql "$iga_POSTGRES_URL_NON_POOLING" -f db/001_esquema.sql
-- É idempotente: pode correr sobre uma base já criada.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Tabelas
-- -------------------------------------------------------------------------

-- Lista canónica dos Estados. Espelha utils/countries.ts e existe para que a
-- chave estrangeira impeça relatórios de países que não estão no índice.
create table if not exists public.paises (
  id        text primary key check (id ~ '^[A-Z]{2}$'),
  nome_pt   text not null,
  criado_em timestamptz not null default now()
);

comment on table public.paises is 'Os 54 Estados soberanos de África, por ISO 3166-1 alpha-2.';

create table if not exists public.relatorios (
  id        bigint generated always as identity primary key,
  pais_id   text not null references public.paises (id) on delete cascade,
  idioma    text not null check (idioma in ('pt', 'en', 'fr', 'zh', 'ru', 'es', 'de', 'it')),
  gerado_em timestamptz not null default now(),
  modelo    text not null,
  nome_pais text not null,
  capital   text not null default '—',
  populacao text not null default '—',

  -- Média dos quatro pilares activos. Continua a ser calculada fora da base,
  -- pelo mesmo código que serve a geração a pedido; a restrição aqui é uma
  -- rede de segurança, não a autoridade do cálculo.
  iga_score numeric(5, 2) not null check (iga_score between 0 and 100),
  escalao   text not null check (escalao in ('e1', 'e2', 'e3', 'e4', 'e5', 'e6')),

  sintese   text not null default '',
  fontes    text[] not null default '{}',

  -- Duas gerações do mesmo país no mesmo instante seriam um erro de escrita.
  unique (pais_id, idioma, gerado_em)
);

comment on table public.relatorios is 'Histórico completo: uma linha por geração, nunca substituída.';

-- Pilares em tabela própria, e não em JSON, para que o inteiro 0-100 seja
-- imposto pela base. É a mesma armadilha do schema do modelo: com vírgula
-- flutuante aparecem literais absurdos que passam despercebidos.
create table if not exists public.relatorio_pilares (
  relatorio_id bigint not null references public.relatorios (id) on delete cascade,
  pilar        text not null check (
    pilar in ('economic', 'political', 'security', 'international', 'historical')
  ),
  pontuacao    integer not null check (pontuacao between 0 and 100),
  analise      text not null default '',
  primary key (relatorio_id, pilar)
);

-- A consulta dominante é "o mais recente por país e idioma"; a evolução lê a
-- mesma chave por ordem inversa.
create index if not exists relatorios_pais_idioma_data
  on public.relatorios (pais_id, idioma, gerado_em desc);

-- -------------------------------------------------------------------------
-- Vista do estado corrente
-- -------------------------------------------------------------------------

create or replace view public.relatorios_actuais
with (security_invoker = on) as
select distinct on (r.pais_id, r.idioma) r.*
from public.relatorios r
order by r.pais_id, r.idioma, r.gerado_em desc;

-- -------------------------------------------------------------------------
-- Leitura pela aplicação
--
-- Funções em vez de consultas directas: devolvem exactamente a forma que o
-- cliente espera, numa só ida à rede, e evitam expor a estrutura interna a
-- quem só precisa de ler o índice.
-- -------------------------------------------------------------------------

create or replace function public.iga_relatorios_actuais(p_idioma text default 'pt')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.pais_id,
        'countryName', r.nome_pais,
        'capital', r.capital,
        'population', r.populacao,
        'igaScore', r.iga_score,
        'stabilityKey', r.escalao,
        'longAnalysis', r.sintese,
        'sources', to_jsonb(r.fontes),
        'language', r.idioma,
        'generatedAt', (extract(epoch from r.gerado_em) * 1000)::bigint,
        'dimensions', (
          select jsonb_object_agg(p.pilar, jsonb_build_object('score', p.pontuacao, 'analysis', p.analise))
          from public.relatorio_pilares p
          where p.relatorio_id = r.id
        )
      )
      order by r.pais_id
    ),
    '[]'::jsonb
  )
  from public.relatorios_actuais r
  where r.idioma = p_idioma;
$$;

comment on function public.iga_relatorios_actuais(text) is
  'Relatório mais recente de cada país, no formato IGAReport do cliente.';

create or replace function public.iga_evolucao(p_pais text, p_idioma text default 'pt')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'generatedAt', (extract(epoch from r.gerado_em) * 1000)::bigint,
        'igaScore', r.iga_score,
        'stabilityKey', r.escalao,
        'dimensions', (
          select jsonb_object_agg(p.pilar, p.pontuacao)
          from public.relatorio_pilares p
          where p.relatorio_id = r.id
        )
      )
      order by r.gerado_em
    ),
    '[]'::jsonb
  )
  from public.relatorios r
  where r.pais_id = upper(p_pais) and r.idioma = p_idioma;
$$;

comment on function public.iga_evolucao(text, text) is
  'Série histórica de um país, para o gráfico de evolução.';

-- -------------------------------------------------------------------------
-- Segurança ao nível da linha
--
-- O índice é público e destina-se a ser lido por qualquer visitante. O que
-- não pode acontecer é uma escrita a partir do browser: a chave anónima vai
-- no pacote JavaScript e é, por construção, conhecida de todos.
-- -------------------------------------------------------------------------

alter table public.paises            enable row level security;
alter table public.relatorios        enable row level security;
alter table public.relatorio_pilares enable row level security;

drop policy if exists leitura_publica on public.paises;
create policy leitura_publica on public.paises
  for select to anon, authenticated using (true);

drop policy if exists leitura_publica on public.relatorios;
create policy leitura_publica on public.relatorios
  for select to anon, authenticated using (true);

drop policy if exists leitura_publica on public.relatorio_pilares;
create policy leitura_publica on public.relatorio_pilares
  for select to anon, authenticated using (true);

-- Sem políticas de escrita: quem escreve é o script de geração, com a chave
-- de serviço, que contorna RLS por desenho.
revoke insert, update, delete, truncate
  on public.paises, public.relatorios, public.relatorio_pilares
  from anon, authenticated;

grant select on public.paises, public.relatorios, public.relatorio_pilares,
                public.relatorios_actuais
  to anon, authenticated;

grant execute on function public.iga_relatorios_actuais(text) to anon, authenticated;
grant execute on function public.iga_evolucao(text, text)     to anon, authenticated;
