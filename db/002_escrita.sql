-- =========================================================================
-- Escrita de relatórios
--
-- Uma só função, chamada pelo script de geração com a chave de serviço. Existe
-- por duas razões concretas:
--
--   1. Atomicidade. Gravar o relatório e os cinco pilares em dois pedidos
--      separados deixaria, ao primeiro erro de rede, um relatório sem pilares
--      — que na interface é um país com pontuação e sem justificação nenhuma.
--   2. Superfície. O browser nunca precisa de escrever. Manter a escrita numa
--      função com permissão exclusiva do papel de serviço fecha a porta que a
--      chave anónima, publicada no pacote JavaScript, deixaria aberta.
--
-- Aplicar: psql "$iga_POSTGRES_URL_NON_POOLING" -f db/002_escrita.sql
-- =========================================================================

create or replace function public.iga_gravar_relatorio(p jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   bigint;
  v_pais text := upper(p ->> 'id');
begin
  if v_pais is null or v_pais !~ '^[A-Z]{2}$' then
    raise exception 'Identificador de país inválido: %', p ->> 'id';
  end if;

  -- O país tem de existir antes do relatório que lhe aponta.
  insert into public.paises (id, nome_pt)
  values (v_pais, coalesce(nullif(p ->> 'nomePt', ''), p ->> 'countryName', v_pais))
  on conflict (id) do nothing;

  insert into public.relatorios (
    pais_id, idioma, gerado_em, modelo, nome_pais,
    capital, populacao, iga_score, escalao, sintese, fontes
  )
  values (
    v_pais,
    p ->> 'language',
    to_timestamp(((p ->> 'generatedAt')::bigint) / 1000.0),
    coalesce(nullif(p ->> 'model', ''), 'desconhecido'),
    coalesce(nullif(p ->> 'countryName', ''), v_pais),
    coalesce(nullif(p ->> 'capital', ''), '—'),
    coalesce(nullif(p ->> 'population', ''), '—'),
    (p ->> 'igaScore')::numeric,
    p ->> 'stabilityKey',
    coalesce(p ->> 'longAnalysis', ''),
    coalesce(
      (select array_agg(valor) from jsonb_array_elements_text(p -> 'sources') as valor),
      '{}'::text[]
    )
  )
  -- Reexecutar a mesma geração não duplica: actualiza a linha desse instante.
  on conflict (pais_id, idioma, gerado_em) do update
    set modelo    = excluded.modelo,
        nome_pais = excluded.nome_pais,
        capital   = excluded.capital,
        populacao = excluded.populacao,
        iga_score = excluded.iga_score,
        escalao   = excluded.escalao,
        sintese   = excluded.sintese,
        fontes    = excluded.fontes
  returning id into v_id;

  insert into public.relatorio_pilares (relatorio_id, pilar, pontuacao, analise)
  select v_id, chave, (valor ->> 'score')::integer, coalesce(valor ->> 'analysis', '')
  from jsonb_each(p -> 'dimensions') as d (chave, valor)
  on conflict (relatorio_id, pilar) do update
    set pontuacao = excluded.pontuacao,
        analise   = excluded.analise;

  return v_id;
end;
$$;

comment on function public.iga_gravar_relatorio(jsonb) is
  'Grava um relatório e os seus pilares numa só transacção. Apenas o papel de serviço.';

-- A função é security definer: sem esta revogação, qualquer visitante com a
-- chave anónima poderia escrever no índice.
revoke all on function public.iga_gravar_relatorio(jsonb) from public, anon, authenticated;
grant execute on function public.iga_gravar_relatorio(jsonb) to service_role;
