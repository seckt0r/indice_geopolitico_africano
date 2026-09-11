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

const DEFAULT_FILL = '#1e293b'; // Slate 800
const FILTERED_OUT_FILL = '#0f172a'; // Slate 900
const HOVER_STROKE = '#ffffff';
const DEFAULT_STROKE = '#475569';

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
    <div ref={containerRef} className="w-full h-full relative bg-geo-dark overflow-hidden">
      {loadingMap && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-geo-dark z-50">
          <div className="w-64 space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-geo-accent rounded-full animate-spin"></div>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-geo-accent transition-all duration-300 ease-out"
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm font-mono text-geo-muted animate-pulse">
              {showSlowLoadingMessage ? t('loading', language) : '...'}
            </p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-geo-dark z-50 p-8 text-center">
          <AlertTriangle size={48} className="text-red-400 mb-4" />
          <p className="text-slate-200 font-semibold mb-1">{t('mapError', language)}</p>
          <p className="text-xs text-slate-500 font-mono mb-6 max-w-md break-words">{mapError}</p>
          <button
            onClick={() => setReloadToken((n) => n + 1)}
            className="inline-flex items-center gap-2 bg-geo-accent hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            {t('retry', language)}
          </button>
        </div>
      )}

      {!loadingMap && !mapError && (
        <div className="absolute top-6 right-6 z-20">
          <div className="relative group">
            <div className="flex items-center gap-2 bg-geo-panel/95 backdrop-blur border border-slate-700 rounded-lg p-1 pr-3 shadow-lg hover:border-geo-accent transition-colors">
              <div className="p-2 bg-slate-800 rounded text-geo-accent">
                <Filter size={16} />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as StabilityKey | 'all')}
                aria-label={t('filterBy', language)}
                className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer appearance-none pr-6"
              >
                {filterOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-geo-panel text-slate-200">
                    {opt === 'all' ? t('filterAll', language) : stabilityLabel(opt, language)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute -top-5 right-0 text-[10px] text-slate-500 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
              {t('filterBy', language)}
            </div>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
      />

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/90 text-white text-xs px-3 py-2 rounded border border-slate-600 shadow-xl z-[100] -translate-x-1/2 -translate-y-full -mt-3"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-bold text-sm block mb-1">{tooltip.name}</span>
          {tooltip.stabilityKey ? (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STABILITY_COLORS[tooltip.stabilityKey] }}
              ></span>
              <span className="text-gray-300">{stabilityLabel(tooltip.stabilityKey, language)}</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">{t('navClick', language)}</span>
          )}
        </div>
      )}

      {!mapError && (
        <>
          <div className="absolute bottom-6 left-6 bg-geo-panel/95 backdrop-blur p-4 rounded border border-slate-700 shadow-xl pointer-events-none md:pointer-events-auto min-w-[180px]">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider border-b border-slate-700 pb-2">
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
                  <span className="text-slate-300 font-medium">{stabilityLabel(key, language)}</span>
                  <span
                    className="w-4 h-4 rounded shadow-sm border border-white/10"
                    style={{ backgroundColor: STABILITY_COLORS[key] }}
                  ></span>
                </div>
              ))}
              <div
                className={`flex items-center justify-between text-xs pt-1 mt-1 border-t border-slate-700/50 ${
                  selectedFilter !== 'all' ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span className="text-slate-500 italic">{t('notAnalyzed', language)}</span>
                <span className="w-4 h-4 rounded bg-slate-800 border border-slate-600"></span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-geo-panel/90 backdrop-blur p-4 rounded border border-slate-700 shadow-xl pointer-events-none md:pointer-events-auto max-w-xs text-right md:text-left">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
              {t('navigation', language)}
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li className="flex items-center justify-end md:justify-start gap-2">
                {t('navClick', language)}
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 order-first md:order-last"></span>
              </li>
              <li className="flex items-center justify-end md:justify-start gap-2">
                {t('navZoom', language)}
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 order-first md:order-last"></span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
