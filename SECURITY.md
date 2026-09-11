# Política de Segurança

## Modelo de ameaça

Esta aplicação é um cliente estático sem backend próprio. A análise é gerada por
um modelo de linguagem que corre **localmente** através do Ollama.

**Não existe nenhuma chave de API no projeto.** Uma versão anterior integrava a
API do Google Gemini e injectava a chave no bundle do cliente através do
`define` do Vite, o que a tornava legível por qualquer visitante. Essa
integração foi removida.

## Dependências externas em runtime

| Recurso             | Origem                           | Notas                          |
| ------------------- | -------------------------------- | ------------------------------ |
| Modelo de linguagem | Ollama local (`127.0.0.1:11434`) | Não sai da máquina             |
| GeoJSON de África   | `raw.githubusercontent.com`      | Apenas leitura, dados públicos |
| Tipos de letra      | `fonts.googleapis.com`           |                                |
| Imagem do hero      | `images.unsplash.com`            |                                |

Os dados introduzidos pelo utilizador no formulário de contribuições ficam no
`localStorage` do navegador, a menos que `VITE_CONTRIBUTION_ENDPOINT` esteja
configurado — nesse caso são enviados para esse endpoint.

## Se for expor a aplicação publicamente

O proxy `/ollama` do Vite encaminha pedidos para a instância local do Ollama.
Em `npm run dev` e `npm run preview` isso significa que **qualquer pessoa com
acesso à porta 3000 pode usar o seu Ollama**. O servidor escuta em `0.0.0.0`.
Em rede não confiável, altere `server.host` para `127.0.0.1` em `vite.config.ts`.

Num build estático publicado (Firebase Hosting), o proxy não existe: o browser
do visitante tentaria contactar o _seu próprio_ `localhost`. Para um deploy
público real é preciso um serviço de inferência acessível e autenticado — não
basta publicar o `dist/`.

## Reportar vulnerabilidades

Abra uma issue privada ou contacte a equipa de manutenção. Por favor não divulgue
publicamente antes de uma correcção estar disponível.
