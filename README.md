<div align="center">

# 🌍 Catálogo da Geopolítica de África (IGA)

**Um panorama interativo sobre mapas, comparações e dados geopolíticos africanos, com análise gerada por IA local.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)

</div>

## 📖 Sobre o Projeto

O **Catálogo da Geopolítica de África** é uma aplicação React para visualizar, comparar e analisar dados geopolíticos de países africanos através do **Índice Geopolítico Africano (IGA)**.

A análise é gerada por um **modelo de linguagem que corre localmente** (via [Ollama](https://ollama.com/)). Nada é enviado para serviços externos e **não existe nenhuma chave de API**.

O índice é **pré-calculado antes do deploy** e servido como ficheiro estático, pelo que o visitante vê o continente inteiro pontuado no primeiro segundo. O modelo local é necessário para _gerar_ os dados, não para os consultar.

## ✨ Funcionalidades

- ⚡ **Índice pré-calculado:** os 54 Estados chegam ao browser já pontuados e classificados. O mapa abre colorido e o painel preenchido, sem esperar por inferência.
- 📈 **Histórico por país:** cada geração fica registada, e o painel traça a evolução da classificação ao longo do tempo.
- 🗺️ **Mapa interativo:** mapa D3 com zoom, filtro por escalão e legenda, à esquerda do ecrã.
- 📑 **Painel permanente:** o relatório do país seleccionado fica sempre visível à direita, e empilha por baixo do mapa em ecrãs estreitos.
- 📊 **Comparações detalhadas:** até 3 países lado a lado, com radar pentagonal dos 5 pilares.
- 🧠 **Análise local (Ollama):** os relatórios são gerados na sua máquina, sem custos de API nem envio de dados.
- 📚 **Documentação integrada:** páginas dedicadas à metodologia, ao algoritmo e ao catálogo de fontes.
- 🌐 **8 idiomas:** PT, EN, FR, ES, DE, IT, RU, ZH.

## 🚀 Como Executar Localmente

**Pré-requisitos:** Node.js v20 ou superior e [Ollama](https://ollama.com/download) instalado.

1. **Prepare o modelo local:**

   ```bash
   ollama serve          # se ainda não estiver a correr
   ollama pull qwen3:8b  # ~5 GB
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure o ambiente (opcional):**

   Os valores por omissão funcionam sem qualquer configuração. Para ajustar,
   copie o exemplo e edite:

   ```bash
   cp .env.example .env
   ```

4. **Inicie a Aplicação:**

   ```bash
   npm run dev   # http://localhost:3000
   ```

### ⏱️ Sobre o desempenho

Um relatório completo tem cerca de 1500 tokens. **Numa máquina sem GPU isto demora
entre 4 e 9 minutos** — o `qwen3:8b` roda a ~3 tokens/s em CPU. A interface mostra
um contador de tempo decorrido, e cada relatório fica em cache durante a sessão,
pelo que reabrir um país já analisado é instantâneo.

Com GPU o tempo cai drasticamente. Para hardware mais modesto, considere um modelo
mais pequeno:

```bash
ollama pull llama3.2
# depois, no .env:
VITE_OLLAMA_MODEL=llama3.2
```

## 🛠️ Scripts

| Comando                   | O que faz                                |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento (porta 3000) |
| `npm run build`           | Verifica tipos e constrói para `dist/`   |
| `npm run preview`         | Serve o build                            |
| `npm run typecheck`       | `tsc --noEmit`                           |
| `npm run lint`            | ESLint                                   |
| `npm run format`          | Prettier                                 |
| `npm run dados:gerar`     | Pré-calcula o índice dos 54 países       |
| `npm run dados:verificar` | Valida o conjunto antes de publicar      |

## 🧱 Tecnologias Utilizadas

- **Core:** React 19, TypeScript, Vite 6
- **Estilo:** Tailwind CSS 3 (em build) + `tailwindcss-animate`
- **Visualização de Dados:** D3.js (mapa e radar), Chart.js (pesos dos pilares)
- **IA:** Ollama local, saída estruturada por JSON Schema

## 🗄️ Base de dados e actualização diária

O índice não é calculado no browser do visitante. Um script em Node percorre os
54 Estados, gera cada relatório com o modelo local e grava-o numa base Postgres
(Supabase), de onde a aplicação o lê ao arrancar:

```bash
npm run dados:gerar                 # incremental: só o que passou das 24 horas
npm run dados:gerar -- --force      # regenera tudo
npm run dados:gerar -- --only=AO,GH # apenas estes países
npm run dados:verificar             # valida o índice que está na base
npm run dados:importar -- ficheiro.json  # importa um conjunto antigo
```

O script é reentrante: grava cada país mal o gera e continua quando um falha.
O prompt, o schema e o cálculo são exactamente os mesmos da geração a pedido,
reutilizados de `services/igaService.ts`.

Esquema em `db/`, aplicável com psql:

```bash
psql "$SUPABASE_POSTGRES_URL" -f db/001_esquema.sql
psql "$SUPABASE_POSTGRES_URL" -f db/002_escrita.sql
```

Três tabelas: `paises`, `relatorios` (uma linha por geração, nunca substituída)
e `relatorio_pilares`. A leitura passa por duas funções, `iga_relatorios_actuais`
e `iga_evolucao`, abertas ao público; a escrita passa por `iga_gravar_relatorio`,
exclusiva do papel de serviço.

Para manter os dados frescos de 24 em 24 horas:

- **Cron local**, na máquina onde o Ollama corre. Ver `scripts/cron-actualizar.sh`.
- **GitHub Actions**, em `.github/workflows/actualizar-dados.yml`, num runner
  self-hosted com acesso ao Ollama. Os runners do GitHub não servem: não têm o
  modelo descarregado.

Dados novos **não exigem republicar o site**: o browser lê a base em cada visita.

## 🚢 Publicação (Vercel)

Cada push para `main` publica em produção; cada pull request publica uma
pré-visualização e comenta o URL no próprio PR. A publicação só acontece depois
de passarem a verificação de tipos, o lint, a formatação, o build e a validação
do conjunto de dados.

Configuração, uma vez:

```bash
npx vercel link          # cria .vercel/project.json com orgId e projectId
```

Depois, em **Settings → Secrets and variables → Actions** do repositório:

| Segredo             | Onde obter                                  |
| ------------------- | ------------------------------------------- |
| `VERCEL_TOKEN`      | vercel.com/account/tokens                   |
| `VERCEL_ORG_ID`     | campo `orgId` de `.vercel/project.json`     |
| `VERCEL_PROJECT_ID` | campo `projectId` de `.vercel/project.json` |

`vercel.json` guarda o preset, o comando de build, os cabeçalhos de cache e os
cabeçalhos de segurança, entre os quais uma política de conteúdo que proíbe
scripts de terceiros. Ver `SECURITY.md`.

## 🧮 Metodologia

O IGA é a média aritmética dos **4 pilares activos**, com peso igual de 25 % cada:
capacidade económica, governação endógena, segurança e controlo territorial, e
gestão da interdependência. O quinto pilar, de trajetória histórica, é um quadro
moderador de variáveis nominais e não entra na média. A página **Metodologia**
da aplicação detalha cada um, e a página **Algoritmo** documenta o pipeline.

> **Nota importante:** as pontuações são **estimativas produzidas por um modelo de
> linguagem**, não medições verificadas. As fontes listadas são citações declaradas
> pelo modelo e não são validadas automaticamente. O `igaScore` e o nível de
> estabilidade são recalculados no cliente a partir das pontuações dos pilares —
> a aritmética não é delegada ao modelo.
