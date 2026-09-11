import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AlertTriangle, Filter, RefreshCw } from 'lucide-react';
import {
  CountryGeoFeature,
  CountryRef,
  Language,
  MapTooltipData,
  STABILITY_KEYS,
  StabilityKey,
} from '../types';
import { t } from '../utils/translations';
import { STABILITY_COLORS, stabilityLabel } from '../utils/stability';

interface AfricaMapProps {
  onCountryClick: (country: CountryRef) => void;
  /** Indexado por ISO alpha-2 — chave estável, independente do idioma. */
  countryStatusMap?: Record<string, StabilityKey>;
  language: Language;
}

const GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/africa.geojson';

// Cartografia em papel claro: o país por analisar é um cinzento neutro, não
// um vazio escuro, e o país filtrado desvanece em vez de escurecer.
const DEFAULT_FILL = '#e7e3da';
const FILTERED_OUT_FILL = '#f2f0eb';
const HOVER_STROKE = '#16202e';
const DEFAULT_STROKE = '#b9b1a2';

const LOCALES: Record<Language, string> = {
  pt: 'pt-PT',
  en: 'en-US',
  fr: 'fr-FR',
  zh: 'zh-CN',
  ru: 'ru-RU',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
};

/**
 * Nomes que o Intl.DisplayNames não resolve como queremos.
 * Estrutura por idioma para não acumular `if`s à medida que surjam mais casos.
 */
const NAME_OVERRIDES: Partial<Record<Language, Record<string, string>>> = {
  pt: { SZ: 'Essuatíni' },
};

/** ISO alpha-2 da feature; recai no nome inglês quando o dataset não o traz. */
const featureId = (feature: CountryGeoFeature): string =>
  (feature.properties.iso_a2 || feature.properties.name || '').toUpperCase();

export const AfricaMap: React.FC<AfricaMapProps> = ({ onCountryClick, countryStatusMap = {}, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** Guarda o grupo <g> para que as actualizações de cor não redesenhem a geometria. */
  const rootGroupRef = useRef<SVGGElement | null>(null);

  const [geoData, setGeoData] = useState<CountryGeoFeature[] | null>(null);
  const [tooltip, setTooltip] = useState<MapTooltipData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<StabilityKey | 'all'>('all');

  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  /**
   * Uma única instância por idioma. Antes era construída dentro do loop de
   * render, ou seja ~4 vezes por país em cada redesenho.
   */
  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([LOCALES[language] ?? 'pt-PT'], { type: 'region' });
    } catch {
      return null;
    }
  }, [language]);

  const getTranslatedName = useCallback(
    (feature: CountryGeoFeature): string => {
      const iso = feature.properties.iso_a2?.toUpperCase();
      const override = iso ? NAME_OVERRIDES[language]?.[iso] : undefined;
      if (override) return override;
      if (iso && displayNames) {
        try {
          const resolved = displayNames.of(iso);
          if (resolved) return resolved;
        } catch {
          /* cai no nome do dataset */
        }
      }
      return feature.properties.name;
    },
    [displayNames, language]
  );

  // --- Carregamento do GeoJSON -------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setLoadingMap(true);
    setMapError(null);
    setLoadProgress(0);
    setShowSlowLoadingMessage(false);

    const slowLoadTimer = setTimeout(() => {
      if (isMounted) setShowSlowLoadingMessage(true);
    }, 2000);

    const progressInterval = setInterval(() => {
      setLoadProgress((prev) => (prev >= 90 ? prev : Math.min(prev + Math.random() * 15, 90)));
    }, 300);

    const stopTimers = () => {
      clearTimeout(slowLoadTimer);
      clearInterval(progressInterval);
    };

    (async () => {
      try {
        const response = await fetch(GEOJSON_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!isMounted) return;
        setLoadProgress(100);
        setGeoData(data.features);
        setTimeout(() => isMounted && setLoadingMap(false), 400);
      } catch (err) {
        if (!isMounted) return;
        // Antes isto era apenas um console.error e o utilizador ficava com um
        // ecrã preto sem explicação nenhuma.
        console.error('Map loading error:', err);
        setMapError(err instanceof Error ? err.message : String(err));
        setLoadingMap(false);
      } finally {
        stopTimers();
      }
    })();

    return () => {
      isMounted = false;
      stopTimers();
    };
  }, [reloadToken]);

  // --- Medição do container ----------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Desenho da geometria (raro) ---------------------------------------
  // Depende só dos dados e do tamanho. Separar este efeito do que actualiza as
  // cores é o que permite manter o zoom/pan do utilizador quando ele analisa um
  // país, muda o filtro ou troca de idioma.
  useEffect(() => {
    if (!geoData || !svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const projection = d3.geoMercator();
    projection.fitExtent(
      [
        [0, 0],
        [width, height],
      ],
      { type: 'FeatureCollection', features: geoData } as any
    );

    const pathGenerator = d3.geoPath().projection(projection);
    const g = svg.append('g');
    rootGroupRef.current = g.node();

    g.selectAll('path')
      .data(geoData)
      .enter()
      .append('path')
      .attr('d', pathGenerator as any)
      .attr('class', 'country-path cursor-pointer transition-[fill,opacity] duration-300 ease-in-out')
      .attr('stroke', DEFAULT_STROKE)
      .attr('stroke-width', 0.5)
      .attr('fill', DEFAULT_FILL);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    return () => {
      svg.on('.zoom', null);
    };
  }, [geoData, dimensions]);

  // --- Actualização de cores, opacidade e handlers (frequente) -----------
  // Só mexe em atributos dos <path> já desenhados. Nunca recria a geometria,
  // por isso a transformação de zoom sobrevive.
  useEffect(() => {
    const group = rootGroupRef.current;
    if (!group || !geoData) return;

    d3.select(group)
      .selectAll<SVGPathElement, CountryGeoFeature>('path')
      .attr('fill', (d) => {
        const status = countryStatusMap[featureId(d)];
        if (selectedFilter !== 'all' && status !== selectedFilter) return FILTERED_OUT_FILL;
        return status ? STABILITY_COLORS[status] : DEFAULT_FILL;
      })
      .attr('opacity', (d) => {
        if (selectedFilter === 'all') return 1;
        return countryStatusMap[featureId(d)] === selectedFilter ? 1 : 0.3;
      })
      .on('mouseover', function (event: MouseEvent, d) {
        d3.select(this).attr('stroke', HOVER_STROKE).attr('stroke-width', 1.5).raise();
        const bounds = containerRef.current?.getBoundingClientRect();
        setTooltip({
          // Coordenadas relativas ao container: o tooltip é posicionado com
          // `absolute` dentro dele, não com `fixed` sobre a página.
          x: event.clientX - (bounds?.left ?? 0),
          y: event.clientY - (bounds?.top ?? 0),
          name: getTranslatedName(d),
          stabilityKey: countryStatusMap[featureId(d)],
        });
      })
      .on('mousemove', function (event: MouseEvent) {
        const bounds = containerRef.current?.getBoundingClientRect();
        setTooltip((prev) =>
          prev
            ? { ...prev, x: event.clientX - (bounds?.left ?? 0), y: event.clientY - (bounds?.top ?? 0) }
            : null
        );
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', DEFAULT_STROKE).attr('stroke-width', 0.5);
        setTooltip(null);
      })
      .on('click', (_event: MouseEvent, d) => {
        setTooltip(null);
        onCountryClick({ id: featureId(d), name: getTranslatedName(d) });
      });
  }, [geoData, countryStatusMap, selectedFilter, getTranslatedName, onCountryClick, dimensions]);

  const filterOptions: Array<StabilityKey | 'all'> = ['all', ...STABILITY_KEYS];

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-geo-paper">
      {loadingMap && !mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-geo-paper">
          <div className="w-64 space-y-4">
            <div className="flex justify-center">
              <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-geo-line border-t-geo-primary"></div>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-geo-line">
              <div
                className="h-full bg-geo-primary transition-all duration-300 ease-out"
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
            <p className="text-center font-mono text-sm text-geo-muted">
              {showSlowLoadingMessage ? t('loading', language) : '...'}
            </p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-geo-paper p-8 text-center">
          <AlertTriangle size={44} className="mb-4 text-red-700" />
          <p className="mb-1 font-semibold text-geo-ink">{t('mapError', language)}</p>
          <p className="mb-6 max-w-md break-words font-mono text-xs text-geo-muted">{mapError}</p>
          <button
            onClick={() => setReloadToken((n) => n + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-geo-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#0d2b46]"
          >
            <RefreshCw size={16} />
            {t('retry', language)}
          </button>
        </div>
      )}

      {!loadingMap && !mapError && (
        <div className="absolute right-3 top-3 z-20 md:right-5 md:top-5">
          <div className="relative group">
            <div className="flex items-center gap-2 rounded-lg border border-geo-line bg-geo-surface/95 p-1 pr-3 shadow-card backdrop-blur transition-colors hover:border-geo-strong">
              <div className="rounded bg-geo-subtle p-2 text-geo-primary">
                <Filter size={16} />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as StabilityKey | 'all')}
                aria-label={t('filterBy', language)}
                className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-geo-ink outline-none"
              >
                {filterOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? t('filterAll', language) : stabilityLabel(opt, language)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="#6e7887"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute -top-5 right-0 text-[10px] font-semibold uppercase tracking-wider text-geo-muted opacity-0 transition-opacity group-hover:opacity-100">
              {t('filterBy', language)}
            </div>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(22,32,46,0.10))' }}
      />

      {tooltip && (
        <div
          className="pointer-events-none absolute z-[100] -mt-3 -translate-x-1/2 -translate-y-full rounded-lg border border-geo-line bg-geo-surface px-3 py-2 text-xs shadow-lift"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="mb-1 block text-sm font-semibold text-geo-ink">{tooltip.name}</span>
          {tooltip.stabilityKey ? (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STABILITY_COLORS[tooltip.stabilityKey] }}
              ></span>
              <span className="text-geo-body">{stabilityLabel(tooltip.stabilityKey, language)}</span>
            </div>
          ) : (
            <span className="text-[10px] italic text-geo-muted">{t('navClick', language)}</span>
          )}
        </div>
      )}

      {!mapError && (
        <>
          <div className="pointer-events-none absolute bottom-4 left-4 hidden min-w-[180px] rounded-xl border border-geo-line bg-geo-surface/95 p-4 shadow-card backdrop-blur md:block md:pointer-events-auto">
            <h4 className="mb-3 border-b border-geo-line pb-2 text-xs font-semibold uppercase tracking-wider text-geo-muted">
              {t('legend', language)}
            </h4>
            <div className="space-y-2">
              {STABILITY_KEYS.map((key) => (
                <div
                  key={key}
                  className={`flex items-center justify-between text-xs transition-opacity duration-300 ${
                    selectedFilter !== 'all' && selectedFilter !== key ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <span className="font-medium text-geo-body">{stabilityLabel(key, language)}</span>
                  <span
                    className="h-3.5 w-3.5 rounded-sm border border-black/10"
                    style={{ backgroundColor: STABILITY_COLORS[key] }}
                  ></span>
                </div>
              ))}
              <div
                className={`mt-1 flex items-center justify-between border-t border-geo-line pt-2 text-xs ${
                  selectedFilter !== 'all' ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span className="italic text-geo-muted">{t('notAnalyzed', language)}</span>
                <span className="h-3.5 w-3.5 rounded-sm border border-geo-strong bg-geo-subtle"></span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 hidden max-w-xs rounded-xl border border-geo-line bg-geo-surface/95 p-4 shadow-card backdrop-blur xl:block xl:pointer-events-auto">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-geo-muted">
              {t('navigation', language)}
            </h4>
            <ul className="space-y-1.5 text-xs text-geo-body">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-geo-accent"></span>
                {t('navClick', language)}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-geo-accent"></span>
                {t('navZoom', language)}
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
