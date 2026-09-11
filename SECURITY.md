# Política de Segurança

## Modelo de ameaça

Um cliente estático, publicado no Vercel, que lê um índice público de uma base
de dados Postgres (Supabase) e, em desenvolvimento, pode gerar relatórios novos
com um modelo de linguagem que corre **localmente** através do Ollama.

Não há backend próprio, não há contas de utilizador e não há dados pessoais
guardados no servidor. O que existe a proteger é: a integridade do índice, as
chaves privilegiadas e a instância local do Ollama de quem desenvolve.

## Chaves e segredos

| Chave                        | Onde vive                       | Pode ser pública? |
| ---------------------------- | ------------------------------- | ----------------- |
| URL do Supabase              | pacote JavaScript, `vars` do CI | Sim               |
| Chave publicável do Supabase | pacote JavaScript, `vars` do CI | Sim, por desenho  |
| Chave de serviço do Supabase | `.env` local, segredo do CI     | **Nunca**         |
| `VERCEL_TOKEN`               | segredo do CI                   | **Nunca**         |
| Palavra-passe do Postgres    | `.env` local                    | **Nunca**         |

A chave publicável é embutida no pacote e é, por construção, conhecida de todos.
O que protege o índice não é o segredo da chave: é a **segurança ao nível da
linha** na base de dados. As três tabelas só têm política de leitura, os verbos
de escrita estão revogados para os papéis `anon` e `authenticated`, e a função
de escrita `iga_gravar_relatorio` só pode ser executada pelo papel de serviço.
Ver `db/001_esquema.sql` e `db/002_escrita.sql`.

Duas defesas impedem que uma chave privilegiada seja publicada por acidente:

1. Nenhuma variável sensível tem prefixo `VITE_`, e só esse prefixo é exposto
   pelo Vite ao cliente. O `vite.config.ts` lê explicitamente apenas o URL e a
   chave pública.
2. O workflow de publicação procura a chave de serviço dentro do artefacto
   construído e aborta a publicação se a encontrar.

**Uma versão anterior deste projecto integrava a API do Google Gemini e
injectava a chave no pacote através do `define` do Vite**, o que a tornava
legível por qualquer visitante. Essa integração foi removida.

## Dependências externas em runtime

| Recurso             | Origem                           | Notas                                     |
| ------------------- | -------------------------------- | ----------------------------------------- |
| Índice IGA          | Supabase (PostgREST)             | Leitura pública, imposta por RLS          |
| Tipos de letra      | `fonts.googleapis.com`           | Permitido pela política de conteúdo       |
| Modelo de linguagem | Ollama local (`127.0.0.1:11434`) | Só em desenvolvimento; não sai da máquina |

A cartografia de África deixou de ser carregada do `raw.githubusercontent.com`
em cada visita: está versionada em `public/dados/africa.geojson` e é servida
pela própria aplicação.

## Cabeçalhos de segurança

`vercel.json` define, para todas as respostas: uma política de segurança de
conteúdo que proíbe scripts de terceiros e restringe as ligações de rede à
própria origem e ao Supabase, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` sem câmara, microfone nem geolocalização, HSTS com dois
anos, e `Cross-Origin-Opener-Policy: same-origin`.

## Dados introduzidos pelo utilizador

O formulário de contribuições recolhe nome, instituição, email e uma sugestão.
Os campos são aparados e limitados em comprimento antes de saírem do formulário.
Sem `VITE_CONTRIBUTION_ENDPOINT` configurado, ficam no `localStorage` do próprio
navegador — nunca saem do dispositivo — e o histórico local está limitado às 50
submissões mais recentes. Com o endpoint configurado, são enviados para esse
endereço, que passa a ser responsável pelo tratamento desses dados pessoais.

## Integridade do índice

Nada do que chega da base é aceite como está. Em `services/reportDataset.ts`,
as pontuações são forçadas a inteiros dentro de 0-100, os textos são aparados e
limitados, e a **pontuação composta e o escalão são recalculados no cliente**.
Um valor adulterado na base não passa uma classificação errada para o mapa.

## Desenvolvimento local

O proxy `/ollama` do Vite encaminha pedidos para a instância local do Ollama.
O servidor escuta em `127.0.0.1` por omissão, precisamente para que ninguém na
mesma rede possa usar o seu modelo. Para servir a outros dispositivos, defina
`VITE_DEV_HOST=0.0.0.0` — e faça-o apenas em rede de confiança.

## Reportar vulnerabilidades

Abra uma issue privada ou contacte a equipa de manutenção. Por favor não divulgue
publicamente antes de uma correcção estar disponível.
