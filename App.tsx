import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  FileText,
  FlaskConical,
  GitCompare,
  Globe,
  GraduationCap,
  Languages,
  Map as MapIcon,
  X,
} from 'lucide-react';
import { AfricaMap } from './components/AfricaMap';
import { Sidebar } from './components/Sidebar';
import { MethodologyPage } from './components/MethodologyPage';
import { ComparisonPage } from './components/ComparisonPage';
import { fetchCountryAnalysis, getCachedReport } from './services/igaService';
import { AiError, checkOllamaHealth } from './services/ollamaClient';
import { CountryRef, IGAReport, Language, StabilityKey } from './types';
import { t } from './utils/translations';
import type { TranslationKey } from './utils/translations';

enum Page {
  HOME,
  MAP,
  METHODOLOGY,
  COMPARE,
}

const MAX_COMPARE = 3;

const LANGUAGE_OPTIONS: Language[] = ['pt', 'en', 'fr', 'es', 'de', 'it', 'ru', 'zh'];

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
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [selectedCountry, setSelectedCountry] = useState<CountryRef | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportData, setReportData] = useState<IGAReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('pt');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  /** Caracteres já recebidos do modelo — progresso real, não simulado. */
  const [progressChars, setProgressChars] = useState(0);

  /** Indexado por ISO alpha-2: a chave é estável quando o idioma muda. */
  const [analyzedCountries, setAnalyzedCountries] = useState<Record<string, StabilityKey>>({});
  const [comparisonList, setComparisonList] = useState<IGAReport[]>([]);

  /** Mensagem efémera — substitui o `alert("Max 3")`. */
  const [toast, setToast] = useState<string | null>(null);
  /** Aviso persistente quando o Ollama não está acessível. */
  const [healthWarning, setHealthWarning] = useState<string | null>(null);

  /** Cancela o pedido anterior quando o utilizador clica noutro país. */
  const abortRef = useRef<AbortController | null>(null);

  // Verifica o Ollama uma vez ao arrancar, para avisar antes do primeiro clique
  // em vez de deixar o utilizador esperar minutos por um erro.
  useEffect(() => {
    let active = true;
    checkOllamaHealth().then((result) => {
      if (!active) return;
      setHealthWarning(result.ok === true ? null : result.message);
    });
    return () => {
      active = false;
    };
  }, []);

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

  const handleCountryClick = useCallback(
    async (country: CountryRef) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSelectedCountry(country);
      setIsSidebarOpen(true);
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

  const closeSidebar = () => setIsSidebarOpen(false);

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

  const navButtonClass = (page: Page) =>
    `text-sm font-medium transition-colors flex items-center gap-1 ${
      currentPage === page ? 'text-geo-accent' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="h-screen flex flex-col font-sans text-geo-text bg-geo-dark selection:bg-geo-accent selection:text-white overflow-hidden">
      <header className="h-16 shrink-0 border-b border-slate-800 flex items-center px-4 md:px-6 bg-geo-dark/95 backdrop-blur z-40 relative">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCurrentPage(Page.HOME)}
        >
          <Globe
            className="text-geo-accent group-hover:rotate-180 transition-transform duration-700"
            size={28}
          />
          <h1 className="text-xl font-serif font-bold tracking-tight text-white group-hover:text-geo-accent transition-colors hidden md:block">
            {t('appTitle', language)}
          </h1>
          <h1 className="text-xl font-serif font-bold tracking-tight text-white group-hover:text-geo-accent transition-colors md:hidden">
            {t('appTitleShort', language)}
          </h1>
        </div>
        <nav className="ml-auto flex gap-3 md:gap-6 items-center">
          <div className="gap-4 hidden sm:flex">
            <button onClick={() => setCurrentPage(Page.HOME)} className={navButtonClass(Page.HOME)}>
              {t('about', language)}
            </button>
            <button
              onClick={() => setCurrentPage(Page.METHODOLOGY)}
              className={navButtonClass(Page.METHODOLOGY)}
            >
              <FileText size={16} className="hidden sm:block" />
              {t('methodology', language)}
            </button>
            <button onClick={() => setCurrentPage(Page.MAP)} className={navButtonClass(Page.MAP)}>
              <MapIcon size={16} className="hidden sm:block" />
              {t('map', language)}
            </button>
          </div>

          <div className="relative">
            <div className="flex items-center gap-1 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50 hover:border-geo-accent transition-colors">
              <Languages size={16} className="text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                aria-label="Language"
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer appearance-none uppercase w-8"
                style={{ textAlignLast: 'center' }}
              >
                {LANGUAGE_OPTIONS.map((code) => (
                  <option key={code} value={code} className="bg-geo-panel">
                    {code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </nav>
      </header>

      {/* Aviso de infraestrutura: o modelo corre localmente e pode não estar a correr. */}
      {healthWarning && (
        <div className="shrink-0 bg-amber-950/60 border-b border-amber-800/60 px-4 py-2 flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="font-mono">{healthWarning}</span>
          <button
            onClick={() => setHealthWarning(null)}
            className="ml-auto text-amber-400 hover:text-amber-200 shrink-0"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden bg-geo-dark">
        {currentPage === Page.HOME && (
          <div className="w-full h-full overflow-y-auto relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[url('https://images.unsplash.com/photo-1543187127-14e4b5182937?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center min-h-[calc(100vh-4rem)]">
              <div className="absolute inset-0 bg-geo-dark/85"></div>

              <div className="relative z-10 max-w-3xl space-y-8 animate-in fade-in zoom-in duration-700">
                <span className="text-geo-accent font-bold tracking-[0.2em] uppercase text-xs md:text-sm border border-geo-accent px-4 py-2 rounded-full inline-block mb-4">
                  {t('heroBadge', language)}
                </span>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                  {t('heroTitle', language)}
                </h2>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  {t('heroSubtitle', language)}
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <button
                    onClick={() => setCurrentPage(Page.MAP)}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-geo-accent font-sans rounded-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 shadow-lg shadow-amber-900/20"
                  >
                    <MapIcon className="mr-3" />
                    {t('accessMap', language)}
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Page.METHODOLOGY)}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-800 border border-slate-700 font-sans rounded-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600 hover:border-slate-500"
                  >
                    <FileText className="mr-3" />
                    {t('methodology', language)}
                  </button>
                </div>
              </div>

              <div className="absolute bottom-0 w-full border-t border-slate-800/50 bg-geo-dark/95 backdrop-blur z-20">
                <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start text-left">
                    <div className="space-y-3">
                      <h3 className="text-geo-accent font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                        <Building2 size={14} /> {t('developedBy', language)}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {t('researchGroup', language)} -{' '}
                        <strong className="text-white font-semibold">{t('institute', language)}</strong>.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-geo-accent font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                        <FlaskConical size={14} /> {t('application', language)}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-white font-semibold">{t('lab', language)}</strong> (INEACET).
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-geo-accent font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                        <GraduationCap size={14} /> {t('collab', language)}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{t('collabText', language)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === Page.MAP && (
          <div className="w-full h-full animate-in fade-in duration-500 overflow-hidden">
            <AfricaMap
              onCountryClick={handleCountryClick}
              countryStatusMap={analyzedCountries}
              language={language}
            />
          </div>
        )}

        {currentPage === Page.METHODOLOGY && (
          <div className="w-full h-full overflow-y-auto bg-geo-dark">
            <MethodologyPage language={language} />
          </div>
        )}

        {currentPage === Page.COMPARE && (
          <div className="w-full h-full overflow-y-auto bg-geo-dark">
            <ComparisonPage
              countries={comparisonList}
              onRemove={handleRemoveFromCompare}
              language={language}
            />
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 border border-geo-accent/60 text-slate-100 text-sm px-5 py-3 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {comparisonList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur border border-geo-accent/50 rounded-xl shadow-2xl p-4 flex items-center gap-4 pointer-events-auto animate-in slide-in-from-bottom-6">
            <div className="flex -space-x-2">
              {comparisonList.map((c) => (
                <div
                  key={c.id}
                  className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                  title={c.countryName}
                >
                  {c.id.slice(0, 2)}
                </div>
              ))}
              {comparisonList.length < MAX_COMPARE && (
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 border-dashed flex items-center justify-center text-slate-500">
                  <span className="text-xs">+</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">{comparisonList.length}</span>/{MAX_COMPARE}
            </div>

            <div className="h-6 w-px bg-slate-700"></div>

            <button
              onClick={() => setCurrentPage(Page.COMPARE)}
              className="bg-geo-accent hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <GitCompare size={16} />
              {t('compare', language)}
            </button>

            <button
              onClick={() => setComparisonList([])}
              className="text-slate-500 hover:text-red-400 transition-colors"
              aria-label={t('remove', language)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        countryName={selectedCountry?.name ?? null}
        data={reportData}
        loading={loadingReport}
        error={errorReport}
        elapsedSeconds={elapsedSeconds}
        progressChars={progressChars}
        onCompare={handleAddToCompare}
        isComparing={!!reportData && comparisonList.some((c) => c.id === reportData.id)}
        language={language}
      />
    </div>
  );
};

export default App;
