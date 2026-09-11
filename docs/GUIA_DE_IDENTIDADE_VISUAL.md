# Manual de Identidade Visual · IGA
## Índice Geopolítico Africano (Catálogo da Geopolítica de África)

---

## 1. Visão Geral e Conceito da Marca

O **Índice Geopolítico Africano (IGA)** é uma plataforma analítica de excelência dedicada à quantificação, mapeamento e diagnóstico estratégico dos 54 Estados soberanos de África. 

A identidade visual do projecto foi concebida para reflectir quatro valores cardeais:
1. **Rigor Académico e Isenção Metodológica:** Ausência de artifícios decorativos desnecessários; clareza inspirada nas publicações de referência cartográfica e económica.
2. **Soberania e Perspectiva Pan-Africana:** Centralidade do continente africano no mapa geopolítico global, recusando a subordinação a narrativas externas.
3. **Precisão Cartográfica e Multidimensionalidade:** Representação da rede de nós e fluxos estratégicos que conectam as diferentes regiões e os 5 pilares do índice.
4. **Longevidade e Atemporalidade:** Tipografia de corte editorial clássico harmonizada com geometria vetorial de vanguarda.

---

## 2. Anatomia do Logotipo

O logotipo oficial do IGA é constituído pela articulação harmónica entre o **Isótipo (Símbolo)** e o **Logótipo Tipográfico (Wordmark)**.

```
       [ ISÓTIPO ]                    [ LOGÓTIPO TIPOGRÁFICO ]
  
     .---.     .---.           IGA •
    /     \   /     \          ÍNDICE GEOPOLÍTICO AFRICANO
   |       '-'       |         CATÁLOGO DE ANÁLISE ESTRATÉGICA
    \               /
     '--.       .--'
         \     /
          '---'
```

### 2.1 O Isótipo (Símbolo Geopolítico)
O símbolo integra três elementos semióticos essenciais:
* **Silhueta do Continente Africano e Madagáscar:** Geometria sintetizada em curvas de Bézier contínuas, mantendo o reconhecimento cartográfico imediato mesmo em dimensões reduzidas (16px / 24px).
* **Anel Orbital e Meridianos:** O meridiano de longitude e o anel elíptico equatorial simbolizam a dimensão geopolítica global, posicionando África no centro do eixo Sul-Sul e das rotas estratégicas mundiais.
* **Constelação dos 5 Pilares (Nós Geodésicos):** 5 nós dourados interligados por linhas de tensão estratégica, correspondendo aos 5 pilares analíticos do IGA:
  1. *Nó Norte:* Trajetória Histórica e Tradição Jurídico-Institucional
  2. *Nó Oeste:* Instituições, Governação e Estado de Direito
  3. *Nó Central:* Economia, Recursos Naturais e Soberania Financeira
  4. *Nó Leste/Sahel:* Defesa, Segurança e Resiliência Estratégica
  5. *Nó Sul:* Relações Regionais, Diplomacia e Integração Continental

### 2.2 O Logótipo Tipográfico (Wordmark)
* **Sigla "IGA":** Composta em **Source Serif 4 Bold**, com serifa sóbria, proporções clássicas e autoridade académica.
* **Ponto de Tensão Dourado (•):** Posicionado ao nível da barra superior da sigla, simbolizando foco analítico e precisão pontual.
* **Título Extenso:** "ÍNDICE GEOPOLÍTICO AFRICANO", composto em caixa alta (**Inter Bold**), com espaçamento entre caracteres (*letter-spacing*) expandido (+0.14em), garantindo leitura estritamente nítida em monitores e materiais impressos.
* **Descritor Institucional:** "CATÁLOGO DE ANÁLISE ESTRATÉGICA" em **Inter Medium**, caixa alta, cor cinzenta atenuada (*geo-muted*).

---

## 3. Ficheiros Oficiais e Formatos de Exportação

Todos os ficheiros mestres estão disponíveis em formato SVG vetorial puro na pasta `/public/` do projecto:

| Ficheiro | Descrição | Utilização Recomendada |
| :--- | :--- | :--- |
| `public/logo.svg` | Logotipo horizontal completo (cores oficiais) | Cabeçalhos web, relatórios formais, papel timbrado |
| `public/logo-dark.svg` | Logotipo horizontal optimizado para fundo escuro | Apresentações nocturnas, terminais, capas de contraste |
| `public/logo-vertical.svg` | Disposição empilhada e centrada | Capas de relatórios em PDF, monografias, posters |
| `public/logo-symbol.svg` | Isótipo isolado (apenas o símbolo vetorial) | Avatares institucionais, marcas de água, selos |
| `public/favicon.svg` | Versão ultra-legível com fundo circular integrado | Separador do browser (Favicon 16x16 / 32x32) |
| `components/Logo.tsx` | Componente React nativo multi-variante e multi-tema | Renderização direta na aplicação web com acessibilidade |

---

## 4. Paleta Cromática Oficial

A paleta de cores inspira-se nos tratados de cartografia histórica e na nobreza mineral da terra africana:

### 4.1 Cores Nucleares Institucionais

| Nome | Amostra | HEX | RGB | HSL | Função |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Azul Geopolítico** | 🟦 | `#123A5E` | `rgb(18, 58, 94)` | `208°, 68%, 22%` | Cor primária institucional, títulos, traço do continente |
| **Ocre Africano** | 🟨 | `#A76B16` | `rgb(167, 107, 22)` | `35°, 77%, 37%` | Acento de destaque, anel equatorial, nós dos pilares |
| **Papel Marfim** | ⬜ | `#FAF9F6` | `rgb(250, 249, 246)` | `45°, 27%, 97%` | Fundo principal da aplicação (textura editorial de papel) |
| **Tinta Ardósia** | ⬛ | `#16202E` | `rgb(22, 32, 46)` | `215°, 35%, 13%` | Texto corrido de alto contraste e subtítulos |

### 4.2 Cores Secundárias e de Suporte

| Nome | HEX | RGB | Aplicação |
| :--- | :--- | :--- | :--- |
| **Azul Suave** | `#EAF0F5` | `rgb(234, 240, 245)` | Selecções, fundos de etiquetas primárias, áreas activas |
| **Ocre Suave** | `#FBF3E4` | `rgb(251, 243, 228)` | Realces de dados, *eyebrows*, alertas metodológicos |
| **Cinza Neutro / Muted** | `#6E7887` | `rgb(110, 120, 135)` | Metadados, legendas de gráficos, descritores |
| **Linha de Cartografia** | `#E5E1D8` | `rgb(229, 225, 216)` | Divisórias e grelhas de tabelas |
| **Linha com Ênfase** | `#CEC7B8` | `rgb(206, 199, 184)` | Molduras de cartões e fronteiras destacadas |

### 4.3 Cores Semânticas dos Escalões do Índice

* 🟢 **Estabilidade Alta (≥ 65):** `#237844` / Fundo `#f0f7f2`
* 🟡 **Estabilidade Moderada (50 – 64.9):** `#8c6b12` / Fundo `#fcf8ed`
* 🟠 **Vulnerabilidade Estrutural (35 – 49.9):** `#b2591f` / Fundo `#fcf4ef`
* 🔴 **Fragilidade Crítica (< 35):** `#a82b2b` / Fundo `#faeded`

---

## 5. Sistema Tipográfico

O sistema tipográfico foi estruturado em três famílias com propósitos complementares:

### 5.1 Família Display e Editorial: *Source Serif 4*
* **Uso:** Sigla "IGA", títulos de primeiro nível (H1), citações institucionais e relatórios formais.
* **Características:** Tipografia com serifa humanista, excelente legibilidade óptica em tamanhos grandes e pequenos.
* **Pesos Oficiais:** Regular (400), SemiBold (600), Bold (700).

### 5.2 Família de Interface e Corpo: *Inter*
* **Uso:** Subtítulos do logótipo, navegação, menus, tabelas, formulários e corpo de texto corrido.
* **Características:** Geometria pura, neutralidade contemporânea e ecrã táctil otimizado.
* **Pesos Oficiais:** Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700).

### 5.3 Família Técnica e Estatística: *JetBrains Mono*
* **Uso:** Código ISO dos países (ex: `AO`, `ZA`, `NG`), pontuações numéricas, coordenadas geográficas e matrizes JSON.
* **Características:** Monospaçada com números tabulares alinhados por coluna (`tabular-nums`).

---

## 6. Área de Proteção e Escala Mínima

### 6.1 Área de Proteção (Clear Space)
Para garantir impacto visual e legibilidade, o logotipo deve ser sempre rodeado por um espaço livre de elementos gráficos, textos ou bordas.
* A distância mínima de segurança é igual a **0.5 × a altura da letra 'I' da sigla IGA** em todos os quatro lados.

### 6.2 Dimensões Mínimas Recomendadas

* **Formato Horizontal Completo (`logo.svg`):**
  * Ecrã / Digital: Altura mínima de **32px** (Largura proporcional: ~150px).
  * Impressão: Altura mínima de **12 mm**.
* **Formato Compacto (`compact`):**
  * Ecrã / Digital: Altura mínima de **24px**.
* **Isótipo Isolado (`logo-symbol.svg`):**
  * Ecrã / Digital: **20px × 20px**.
* **Favicon (`favicon.svg`):**
  * Otimizado para renderização perfeita em **16px** e **32px**.

---

## 7. Usos Incorretos e Proibições

Para preservar a integridade da marca, é expressamente vedado:

1. **Distorção Proporcional:** Nunca comprimir ou esticar horizontal ou verticalmente o logotipo ou o isótipo.
2. **Alteração Arbitrária de Cores:** Não aplicar gradientes multicoloridos, efeitos de néon ou cores alheias à paleta oficial.
3. **Remoção de Nós:** O isótipo deve sempre preservar a constelação dos 5 nós estratégicos e o anel orbital.
4. **Fundos Sem Contraste:** Não aplicar o logotipo em versão clara sobre fundos claros sem contraste suficiente (proporção mínima WCAG AA 4.5:1).
5. **Efeitos Gráficos Obsoletos:** Não aplicar sombras fortes (*drop shadows* duras), chanfros (*bevel & emboss*) ou contornos externos espessos.

---

## 8. Aplicações e Exemplos no Projeto

* **Barra de Navegação Principal:** Implementado via `<Logo variant="full" size="sm" />` em telas médias/largas e `<Logo variant="compact" size="sm" />` em ecrãs móveis.
* **Rodapé Institucional:** Presença do logotipo completo e créditos do Instituto e Laboratório de Investigação.
* **Separador de Navegação (Browser Tab):** Favicon vetorial com o símbolo continental e nó dourado de alta nitidez.
* **Documentação e Relatórios Técnicos:** Capas em estilo editorial de papel marfim `#FAF9F6` com o logotipo vertical centrado.
