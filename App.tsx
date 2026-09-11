import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  FileText,
  GitCompare,
  Globe,
  Languages,
  Library,
  Map as MapIcon,
  Menu,
  Sigma,
  X,
} from 'lucide-react';
import { MapWorkspace } from './components/MapWorkspace';
import { AboutPage } from './components/AboutPage';
import { MethodologyPage } from './components/MethodologyPage';
import { AlgorithmPage } from './components/AlgorithmPage';
import { SourcesPage } from './components/SourcesPage';
import { ComparisonPage } from './components/ComparisonPage';
import { fetchCountryAnalysis, getCachedReport } from './services/igaService';
import { loadReportDataset } from './services/reportDataset';
import { AiError, checkOllamaHealth } from './services/ollamaClient';
import { CountryRef, IGAReport, Language, ReportDataset, StabilityKey } from './types';
import { t } from './utils/translations';
import type { TranslationKey } from './utils/translations';

enum Page {
  HOME,
  MAP,
  METHODOLOGY,
  ALGORITHM,
  SOURCES,
  COMPARE,
}

const MAX_COMPARE = 3;

const LANGUAGE_OPTIONS: Language[] = ['pt', 'en', 'fr', 'es', 'de', 'it', 'ru', 'zh'];

/** Entradas de navegação, num só sítio: cabeçalho, menu móvel e rodapé. */
const NAV_ITEMS: Array<{ page: Page; labelKey: TranslationKey; icon: React.ElementType }> = [
  { page: Page.HOME, labelKey: 'about', icon: Globe },
  { page: Page.METHODOLOGY, labelKey: 'methodology', icon: FileText },
  { page: Page.ALGORITHM, labelKey: 'navAlgorithm', icon: Sigma },
  { page: Page.SOURCES, labelKey: 'navSources', icon: Library },
  { page: Page.MAP, labelKey: 'map', icon: MapIcon },
];

/** Traduz o tipo de falha do serviço numa mensagem accionável para o utilizador. */
const errorMessageKey = (err: unknown): TranslationKey => {
  if (err instanceof AiError) {
    switch (err.kind) {
      case 'offline':
        return 'aiOffline';
      case 'model_missing':
        return 'aiModelMissing';
      case 'timeout':
        return 'aiTimeout';
      case 'bad_response':
        return 'aiBadResponse';
    }
  }
  return 'errorAnalysis';
};

const App: React.FC = () => {
  // O mapa é a página de entrada: com o índice pré-calculado, há algo para ver
  // no primeiro segundo, sem esperar por nenhuma inferência.
  const [currentPage, setCurrentPage] = useState<Page>(Page.MAP);
  const [selectedCountry, setSelectedCountry] = useState<CountryRef | null>(null);
  const [reportData, setReportData] = useState<IGAReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('pt');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  /** Caracteres já recebidos do modelo — progresso real, não simulado. */
  const [progressChars, setProgressChars] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /** Indexado por ISO alpha-2: a chave é estável quando o idioma muda. */
  const [analyzedCountries, setAnalyzedCountries] = useState<Record<string, StabilityKey>>({});

  /** Conjunto pré-calculado servido como ficheiro estático. */
  const [dataset, setDataset] = useState<ReportDataset | null>(null);
  const [datasetState, setDatasetState] = useState<'loading' | 'ready' | 'fallback' | 'missing'>('loading');
  const [comparisonList, setComparisonList] = useState<IGAReport[]>([]);

  /** Mensagem efémera — substitui o `alert("Max 3")`. */
  const [toast, setToast] = useState<string | null>(null);
  /** Aviso persistente quando o Ollama não está acessível. */
  const [healthWarning, setHealthWarning] = useState<string | null>(null);
  /** O utilizador pode dispensar a faixa de aviso de estado dos dados. */
  const [dismissedNotice, setDismissedNotice] = useState(false);

  /** Cancela o pedido anterior quando o utilizador clica noutro país. */
  const abortRef = useRef<AbortController | null>(null);

  // Carrega o índice pré-calculado. É isto que faz o mapa aparecer já colorido
  // e o painel ter conteúdo antes de qualquer clique.
  useEffect(() => {
    const controller = new AbortController();
    setDatasetState('loading');

    loadReportDataset(language, controller.signal).then((loaded) => {
      if (controller.signal.aborted) return;
      if (!loaded) {
        setDatasetState('missing');
        return;
      }
      setDataset(loaded.dataset);
      // Um escalão calculado nesta sessão é mais recente do que o ficheiro e
      // por isso sobrepõe-se ao que vem do conjunto.
      setAnalyzedCountries((prev) => ({ ...loaded.statusMap, ...prev }));
      setDatasetState(loaded.usedFallback ? 'fallback' : 'ready');
    });

    return () => controller.abort();
  }, [language]);

  // O estado do Ollama só interessa quando é preciso gerar a pedido. Com o
  // conjunto pré-calculado disponível, avisar o visitante de que não tem um
  // modelo local a correr seria ruído sobre um problema que ele não tem.
  useEffect(() => {
    if (datasetState !== 'missing') {
      setHealthWarning(null);
      return;
    }
    let active = true;
    checkOllamaHealth().then((result) => {
      if (!active) return;
      setHealthWarning(result.ok === true ? null : result.message);
    });
    return () => {
      active = false;
    };
  }, [datasetState]);

  // Ao mudar de idioma, troca o relatório aberto pela versão já em cache nesse
  // idioma. Se não existir, mantém o que está: disparar aqui uma geração de
  // vários minutos seria um efeito colateral indesejado de carregar num selector.
  useEffect(() => {
    if (!selectedCountry) return;
    const cached = getCachedReport(selectedCountry.id, language);
    if (cached) setReportData(cached);
  }, [language, selectedCountry]);

  // Contador de tempo decorrido: o modelo local demora vários minutos e sem
  // este sinal a espera é indistinguível de um bloqueio.
  useEffect(() => {
    if (!loadingReport) return;
    setElapsedSeconds(0);
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loadingReport]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  }, []);

  const handleCountryClick = useCallback(
    async (country: CountryRef) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSelectedCountry(country);
      setErrorReport(null);

      // Um relatório em cache aparece instantaneamente; sem isto, reabrir um
      // país já analisado voltaria a custar vários minutos.
      const cached = getCachedReport(country.id, language);
      if (cached) {
        setReportData(cached);
        setLoadingReport(false);
        return;
      }

      setReportData(null);
      setProgressChars(0);
      setLoadingReport(true);

      try {
        const data = await fetchCountryAnalysis(country, language, controller.signal, setProgressChars);
        if (controller.signal.aborted) return;
        setReportData(data);
        setAnalyzedCountries((prev) => ({ ...prev, [country.id]: data.stabilityKey }));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Falha ao gerar relatório IGA:', err);
        setErrorReport(t(errorMessageKey(err), language));
      } finally {
        if (!controller.signal.aborted) setLoadingReport(false);
      }
    },
    [language]
  );

  const handleAddToCompare = (data: IGAReport) => {
    if (comparisonList.some((c) => c.id === data.id)) return;
    if (comparisonList.length >= MAX_COMPARE) {
      setToast(t('maxCompare', language));
      return;
    }
    setComparisonList((prev) => [...prev, data]);
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonList((prev) => prev.filter((c) => c.id !== id));
  };

  /**
   * Mensagem de estado dos dados, ou null quando não há nada a assinalar.
   * O aviso do Ollama só é relevante quando não existe conjunto pré-calculado:
   * nesse caso os relatórios passam a ser gerados a pedido.
   */
  const notice = (() => {
    if (dismissedNotice) return null;
    if (datasetState === 'fallback') return t('dataFallbackNotice', language);
    if (datasetState === 'missing') {
      return healthWarning
        ? `${t('dataMissingNotice', language)} ${healthWarning}`
        : t('dataMissingNotice', language);
    }
    return null;
  })();

  const navButtonClass = (page: Page) =>
    `relative flex items-center gap-1.5 py-1 text-sm font-medium transition-colors ${
      currentPage === page
        ? 'text-geo-primary after:absolute after:-bottom-[21px] after:left-0 after:h-[2px] after:w-full after:bg-geo-accent'
        : 'text-geo-body hover:text-geo-ink'
    }`;

  /** Rodapé institucional, presente em todas as páginas de conteúdo. */
  const footer = (
    <footer className="border-t border-geo-line bg-geo-subtle">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="mb-2 flex items-center gap-2">
              <Globe size={16} className="text-geo-primary" />
              <span className="font-serif text-sm font-bold text-geo-ink">{t('appTitle', language)}</span>
            </div>
            <p className="text-xs leading-relaxed text-geo-muted">{t('footerNote', language)}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className="text-xs font-medium text-geo-body hover:text-geo-primary"
              >
                {t(item.labelKey, language)}
              </button>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-geo-line pt-6 text-xs text-geo-muted">
          {t('institute', language)} · {t('lab', language)}
        </p>
      </div>
    </footer>
  );

  /** Envolve uma página de conteúdo na área com scroll, com rodapé. */
  const contentPage = (node: React.ReactNode) => (
    <div className="h-full overflow-y-auto">
      {node}
      {footer}
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-geo-paper font-sans text-geo-body selection:bg-geo-primarySoft selection:text-geo-ink">
      <header className="relative z-40 flex h-16 shrink-0 items-center border-b border-geo-line bg-geo-surface/95 px-4 backdrop-blur md:px-8">
        <button
          className="group flex items-center gap-2.5 text-left"
          onClick={() => navigate(Page.HOME)}
          aria-label={t('appTitle', language)}
        >
          <Globe
            className="text-geo-primary transition-transform duration-700 group-hover:rotate-180"
            size={24}
          />
          <span className="hidden font-serif text-lg font-bold tracking-tight text-geo-ink md:block">
            {t('appTitle', language)}
          </span>
          <span className="font-serif text-lg font-bold tracking-tight text-geo-ink md:hidden">
            {t('appTitleShort', language)}
          </span>
        </button>

        <nav className="ml-auto flex items-center gap-4 md:gap-7">
          <div className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => navigate(item.page)}
                  className={navButtonClass(item.page)}
                >
                  <Icon size={15} />
                  {t(item.labelKey, language)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-geo-line bg-geo-surface px-2 py-1.5 transition-colors hover:border-geo-strong">
            <Languages size={15} className="text-geo-muted" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="Language"
              className="w-9 cursor-pointer appearance-none bg-transparent text-xs font-semibold uppercase text-geo-ink outline-none"
              style={{ textAlignLast: 'center' }}
            >
              {LANGUAGE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg border border-geo-line p-2 text-geo-body lg:hidden"
            aria-label={t('onThisPage', language)}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </header>

      {/* Navegação em ecrãs estreitos: a barra superior não comporta 5 entradas. */}
      {isMenuOpen && (
        <div className="z-30 shrink-0 border-b border-geo-line bg-geo-surface shadow-card lg:hidden">
          <nav className="flex flex-col p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => navigate(item.page)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                    currentPage === item.page
                      ? 'bg-geo-primarySoft text-geo-primary'
                      : 'text-geo-body hover:bg-geo-subtle'
                  }`}
                >
                  <Icon size={16} />
                  {t(item.labelKey, language)}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Estado dos dados. Só aparece quando há algo accionável a dizer: o
          conjunto pré-calculado falta, ou existe mas não neste idioma. */}
      {notice && (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-200 bg-geo-accentSoft px-4 py-2 text-xs text-amber-900 md:px-8">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span className="min-w-0">{notice}</span>
          <button
            onClick={() => setDismissedNotice(true)}
            className="ml-auto shrink-0 text-amber-700 hover:text-amber-900"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <main className="relative flex-1 overflow-hidden bg-geo-paper">
        {currentPage === Page.HOME &&
          contentPage(
            <AboutPage
              language={language}
              onOpenMap={() => navigate(Page.MAP)}
              onOpenMethodology={() => navigate(Page.METHODOLOGY)}
              onOpenSources={() => navigate(Page.SOURCES)}
            />
          )}

        {currentPage === Page.METHODOLOGY && contentPage(<MethodologyPage language={language} />)}

        {currentPage === Page.ALGORITHM && contentPage(<AlgorithmPage language={language} />)}

        {currentPage === Page.SOURCES && contentPage(<SourcesPage language={language} />)}

        {currentPage === Page.COMPARE &&
          contentPage(
            <ComparisonPage
              countries={comparisonList}
              onRemove={handleRemoveFromCompare}
              language={language}
            />
          )}

        {currentPage === Page.MAP && (
          <div className="h-full w-full overflow-hidden animate-in fade-in duration-500">
            <MapWorkspace
              onCountryClick={handleCountryClick}
              countryStatusMap={analyzedCountries}
              language={language}
              selectedCountryName={selectedCountry?.name ?? null}
              report={reportData}
              loading={loadingReport}
              error={errorReport}
              elapsedSeconds={elapsedSeconds}
              progressChars={progressChars}
              onCompare={handleAddToCompare}
              isComparing={!!reportData && comparisonList.some((c) => c.id === reportData.id)}
              dataset={dataset}
            />
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-lg border border-geo-strong bg-geo-surface px-5 py-3 text-sm text-geo-ink shadow-lift animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {comparisonList.length > 0 && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4">
          <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-3 rounded-xl border border-geo-line bg-geo-surface/97 p-3 shadow-lift backdrop-blur animate-in slide-in-from-bottom-6">
            <div className="flex -space-x-2">
              {comparisonList.map((c) => (
                <div
                  key={c.id}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-geo-surface bg-geo-primarySoft text-xs font-bold text-geo-primary"
                  title={c.countryName}
                >
                  {c.id.slice(0, 2)}
                </div>
              ))}
              {comparisonList.length < MAX_COMPARE && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-geo-strong bg-geo-subtle text-xs text-geo-muted">
                  +
                </div>
              )}
            </div>

            <div className="text-xs text-geo-muted tabular">
              <span className="font-bold text-geo-ink">{comparisonList.length}</span>/{MAX_COMPARE}
            </div>

            <div className="h-6 w-px bg-geo-line"></div>

            <button
              onClick={() => navigate(Page.COMPARE)}
              className="flex items-center gap-2 rounded-lg bg-geo-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0d2b46]"
            >
              <GitCompare size={16} />
              {t('compare', language)}
            </button>

            <button
              onClick={() => setComparisonList([])}
              className="text-geo-muted transition-colors hover:text-red-700"
              aria-label={t('remove', language)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
