import React, { useMemo, useState } from 'react';
import { EvolutionPoint, Language } from '../types';
import { STABILITY_COLORS, stabilityLabel } from '../utils/stability';
import { t } from '../utils/translations';

interface EvolutionChartProps {
  points: EvolutionPoint[];
  language: Language;
}

/** Limiares dos escalões, de baixo para cima. Espelham stabilityFromScore(). */
const BANDAS = [
  { key: 'e6', min: 0, max: 35 },
  { key: 'e5', min: 35, max: 45 },
  { key: 'e4', min: 45, max: 55 },
  { key: 'e3', min: 55, max: 66 },
  { key: 'e2', min: 66, max: 78 },
  { key: 'e1', min: 78, max: 100 },
] as const;

const LARGURA = 320;
const ALTURA = 170;
const MARGEM = { topo: 10, direita: 30, fundo: 24, esquerda: 30 };
const AREA_W = LARGURA - MARGEM.esquerda - MARGEM.direita;
const AREA_H = ALTURA - MARGEM.topo - MARGEM.fundo;

const LOCALES: Record<Language, string> = {
  pt: 'pt-PT',
  en: 'en-GB',
  fr: 'fr-FR',
  zh: 'zh-CN',
  ru: 'ru-RU',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
};

/**
 * Evolução da classificação de um país.
 *
 * Uma só série — a pontuação composta — sobre as faixas dos seis escalões. As
 * faixas levam rótulo próprio em vez de dependerem da cor: duas delas são
 * quase indistinguíveis para quem tenha deficiência de visão cromática, e a
 * legibilidade não pode ficar refém disso.
 *
 * O eixo vertical é fixo em 0-100 de propósito. Ajustá-lo aos dados ampliaria
 * oscilações de um ponto ou dois e faria parecer volatilidade onde não há.
 */
export const EvolutionChart: React.FC<EvolutionChartProps> = ({ points, language }) => {
  const [activo, setActivo] = useState<number | null>(null);

  const formatador = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[language] ?? 'pt-PT', { day: '2-digit', month: 'short' }),
    [language]
  );
  const formatadorLongo = useMemo(
    () =>
      new Intl.DateTimeFormat(LOCALES[language] ?? 'pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [language]
  );

  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-geo-line bg-geo-subtle p-3 text-xs text-geo-muted">
        {t('evolutionEmpty', language)}
      </p>
    );
  }

  const inicio = points[0].generatedAt;
  const fim = points[points.length - 1].generatedAt;
  const intervalo = fim - inicio;

  // Com um só ponto não há eixo temporal: fica centrado, e o texto por baixo
  // explica que a série só começa na próxima actualização.
  const x = (momento: number): number =>
    intervalo === 0
      ? MARGEM.esquerda + AREA_W / 2
      : MARGEM.esquerda + ((momento - inicio) / intervalo) * AREA_W;
  const y = (valor: number): number => MARGEM.topo + AREA_H - (valor / 100) * AREA_H;

  const caminho = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.generatedAt)},${y(p.igaScore)}`)
    .join(' ');
  const ultimo = points[points.length - 1];
  const pontoActivo = activo !== null ? points[activo] : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="w-full"
        role="img"
        aria-label={`${t('evolutionTitle', language)}: ${points.length}`}
      >
        {/* Faixas dos escalões: contexto de fundo, deliberadamente recessivo. */}
        {BANDAS.map((banda) => {
          const topo = y(banda.max);
          const altura = y(banda.min) - topo;
          return (
            <g key={banda.key}>
              <rect
                x={MARGEM.esquerda}
                y={topo}
                width={AREA_W}
                height={altura}
                fill={STABILITY_COLORS[banda.key]}
                opacity={0.07}
              />
              {altura >= 14 && (
                <text
                  x={LARGURA - MARGEM.direita + 4}
                  y={topo + altura / 2}
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="#6e7887"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {banda.key.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Eixo vertical reduzido ao essencial: só 0 e 100 ancoram a leitura. */}
        {[0, 50, 100].map((valor) => (
          <g key={valor}>
            <line
              x1={MARGEM.esquerda}
              x2={LARGURA - MARGEM.direita}
              y1={y(valor)}
              y2={y(valor)}
              stroke="#e5e1d8"
              strokeWidth="1"
            />
            <text
              x={MARGEM.esquerda - 5}
              y={y(valor)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="8"
              fill="#6e7887"
              fontFamily="'JetBrains Mono', monospace"
            >
              {valor}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <path d={caminho} fill="none" stroke="#123a5e" strokeWidth="2" strokeLinejoin="round" />
        )}

        {points.map((ponto, indice) => (
          <g key={ponto.generatedAt}>
            {/* Alvo de rato maior do que a marca, para o ponteiro não escorregar. */}
            <circle
              cx={x(ponto.generatedAt)}
              cy={y(ponto.igaScore)}
              r="10"
              fill="transparent"
              onMouseEnter={() => setActivo(indice)}
              onMouseLeave={() => setActivo(null)}
            />
            <circle
              cx={x(ponto.generatedAt)}
              cy={y(ponto.igaScore)}
              r={activo === indice ? 5 : 4}
              fill="#123a5e"
              stroke="#ffffff"
              strokeWidth="2"
              pointerEvents="none"
            />
            <title>
              {`${formatadorLongo.format(new Date(ponto.generatedAt))} · ${ponto.igaScore.toFixed(1)} · ${stabilityLabel(ponto.stabilityKey, language)}`}
            </title>
          </g>
        ))}

        {/* Rótulo directo do valor mais recente: o número que importa não deve
            depender de o leitor passar o rato por cima. */}
        <text
          x={x(ultimo.generatedAt)}
          y={y(ultimo.igaScore) - 10}
          textAnchor={points.length > 1 ? 'end' : 'middle'}
          fontSize="10"
          fontWeight="700"
          fill="#16202e"
          fontFamily="'JetBrains Mono', monospace"
        >
          {ultimo.igaScore.toFixed(1)}
        </text>

        <text
          x={MARGEM.esquerda}
          y={ALTURA - 6}
          fontSize="8"
          fill="#6e7887"
          fontFamily="'JetBrains Mono', monospace"
        >
          {formatador.format(new Date(inicio))}
        </text>
        {intervalo > 0 && (
          <text
            x={LARGURA - MARGEM.direita}
            y={ALTURA - 6}
            textAnchor="end"
            fontSize="8"
            fill="#6e7887"
            fontFamily="'JetBrains Mono', monospace"
          >
            {formatador.format(new Date(fim))}
          </text>
        )}
      </svg>

      {pontoActivo ? (
        <p className="mt-1 text-xs text-geo-body">
          <span className="font-mono tabular">
            {formatadorLongo.format(new Date(pontoActivo.generatedAt))}
          </span>
          {' · '}
          <span className="font-mono font-semibold text-geo-ink tabular">
            {pontoActivo.igaScore.toFixed(1)}
          </span>
          {' · '}
          {stabilityLabel(pontoActivo.stabilityKey, language)}
        </p>
      ) : (
        points.length === 1 && (
          <p className="mt-1 text-xs text-geo-muted">{t('evolutionBuilding', language)}</p>
        )
      )}
    </div>
  );
};
