# Guia de Contribuição

Obrigado por querer contribuir para o **Catálogo da Geopolítica de África**!

## Pré-requisitos

Além do Node.js 20+, precisa do [Ollama](https://ollama.com/) a correr localmente
com o modelo do projecto:

```bash
ollama serve
ollama pull qwen3:8b
```

Não existe nenhuma chave de API: toda a análise é gerada na sua máquina.

## Processo de Contribuição

1. Procure nas issues existentes se o problema ou funcionalidade já está a ser discutido.
2. Crie um fork do repositório.
3. Crie a sua branch: `git checkout -b feature/SuaSuperFeature`
4. Siga os padrões do `.gitmessage` ao realizar os seus commits (português).
5. Envie as suas mudanças: `git push origin feature/SuaSuperFeature`
6. Abra um Pull Request e preencha o template.

## Antes de abrir o PR

Corra localmente o mesmo que o CI corre:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run format:check  # prettier
npm run build
```

`npm run format` corrige a formatação automaticamente.

## Notas úteis

- **Texto visível ao utilizador** nunca é escrito directamente no componente:
  passa sempre por `t(key, language)` e tem de ser acrescentado às 8 línguas
  suportadas. O `typecheck` falha se faltar alguma.
- **Nomes de classes Tailwind nunca são construídos por interpolação**
  (`grid-cols-${n}` não funciona). Use mapas de classes estáticas.
- **A aritmética do índice é feita no cliente**, não pelo modelo de linguagem.
  Se alterar a metodologia, actualize o prompt, o schema e a página de
  Metodologia no mesmo commit.
