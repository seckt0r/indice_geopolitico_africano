#!/usr/bin/env bash
#
# Actualização diária do índice IGA a partir de um cron local.
#
# Regenera os relatórios e grava-os na base de dados. Não há commit nem
# publicação a seguir: o browser lê o índice da base em cada visita, por isso
# os dados novos aparecem na visita seguinte sem reconstruir o site.
#
# Instalar (na máquina que tem o Ollama):
#   chmod +x scripts/cron-actualizar.sh
#   crontab -e
#   0 3 * * * /caminho/para/IGA/scripts/cron-actualizar.sh >> /var/tmp/iga-cron.log 2>&1
#
# Pré-requisito: um .env na raiz com a configuração do Ollama e a chave de
# serviço do Supabase. O script não imprime nenhum desses valores.
#
# É reentrante: o gerador salta países cujo relatório mais recente ainda está
# dentro da validade de 24 horas, por isso uma execução interrompida retoma
# onde ficou.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Um cron não herda o PATH do shell interactivo; o node precisa de estar visível.
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

echo "=== IGA · $(date --iso-8601=seconds) ==="

# Sem Ollama não há geração possível: sai em silêncio em vez de encher o log.
if ! curl -sf -o /dev/null --max-time 10 "${OLLAMA_HOST:-http://127.0.0.1:11434}/api/tags"; then
  echo "Ollama inacessível. Nada a fazer."
  exit 0
fi

npm run dados:gerar
npm run dados:verificar

echo "Concluído: $(date --iso-8601=seconds)"
