#!/usr/bin/env bash
#
# Actualização diária do índice IGA a partir de um cron local.
#
# Regenera os relatórios, valida o conjunto e confirma-o no repositório. O push
# para `main` é o que dispara o workflow de CI/CD, que publica no Vercel — não
# é preciso construir nem publicar aqui.
#
# Instalar (na máquina que tem o Ollama):
#   chmod +x scripts/cron-actualizar.sh
#   crontab -e
#   0 3 * * * /caminho/para/IGA/scripts/cron-actualizar.sh >> /var/tmp/iga-cron.log 2>&1
#
# Pré-requisito para o push: o git tem de conseguir autenticar-se sem prompt.
# Ou uma chave SSH sem passphrase no agente, ou um credential helper com um
# token guardado. Sem isso o script gera e confirma, mas o push falha.
#
# O script é reentrante: o gerador salta relatórios ainda dentro da validade de
# 24 horas, por isso uma execução interrompida retoma onde ficou.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Um cron não herda o PATH do shell interactivo; o node precisa de estar visível.
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

RAMO="${IGA_BRANCH:-main}"

echo "=== IGA · $(date --iso-8601=seconds) ==="

# Sem Ollama não há geração possível: sai em silêncio em vez de encher o log.
if ! curl -sf -o /dev/null --max-time 10 "${OLLAMA_HOST:-http://127.0.0.1:11434}/api/tags"; then
  echo "Ollama inacessível. Nada a fazer."
  exit 0
fi

# Confirmar apenas os dados. Trabalho em curso noutros ficheiros não é arrastado
# para um commit automático: seria publicado sem ninguém o ter revisto.
if ! git diff --quiet -- ':!public/dados' || ! git diff --cached --quiet; then
  echo "Há alterações por confirmar fora de public/dados. A abortar para não as arrastar."
  git status --short
  exit 1
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "$RAMO" ]; then
  echo "HEAD não está em $RAMO. A abortar."
  exit 1
fi

npm run dados:gerar
npm run dados:verificar

if git diff --quiet -- public/dados; then
  echo "Sem alterações nos dados. Nada a confirmar."
  exit 0
fi

git add public/dados
git commit -m "chore(dados): actualizar índice IGA

Geração automática diária dos 54 relatórios."

# O push para main dispara o workflow de CI/CD, que publica no Vercel.
git push origin "$RAMO"

echo "Concluído: $(date --iso-8601=seconds)"
