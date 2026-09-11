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

A análise é gerada por um **modelo de linguagem que corre localmente** (via [Ollama](https://ollama.com/)), por omissão o `qwen3:8b`. Nada é enviado para serviços externos e **não existe nenhuma chave de API**.

## ✨ Funcionalidades

- 🗺️ **Mapa Interativo Africano:** Mapa D3 com zoom, filtro por nível de estabilidade e legenda.
- 📊 **Comparações Detalhadas:** Até 3 países lado a lado, com radar pentagonal dos 5 pilares.
- 🧠 **Análise Local (Ollama):** Relatórios gerados na sua máquina, sem custos de API nem envio de dados.
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

| Comando             | O que faz                                |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (porta 3000) |
| `npm run build`     | Verifica tipos e constrói para `dist/`   |
| `npm run preview`   | Serve o build                            |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm run lint`      | ESLint                                   |
| `npm run format`    | Prettier                                 |

## 🧱 Tecnologias Utilizadas

- **Core:** React 19, TypeScript, Vite 6
- **Estilo:** Tailwind CSS 3 (em build) + `tailwindcss-animate`
- **Visualização de Dados:** D3.js (mapa e radar), Chart.js (pesos dos pilares)
- **IA:** Ollama local, saída estruturada por JSON Schema

## 🧮 Metodologia

O IGA é a média aritmética simples de 5 pilares com peso igual (20% cada):
capacidade económica, governação, segurança interna, influência internacional e
trajetória histórica. A página **Metodologia** da aplicação detalha cada um.

> **Nota importante:** as pontuações são **estimativas produzidas por um modelo de
> linguagem**, não medições verificadas. As fontes listadas são citações declaradas
> pelo modelo e não são validadas automaticamente. O `igaScore` e o nível de
> estabilidade são recalculados no cliente a partir das pontuações dos pilares —
> a aritmética não é delegada ao modelo.
