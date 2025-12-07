import React, { useState, useCallback } from 'react';
import { AfricaMap } from './components/AfricaMap';
import { Sidebar } from './components/Sidebar';
import { MethodologyPage } from './components/MethodologyPage';
import { ComparisonPage } from './components/ComparisonPage';
import { fetchCountryAnalysis } from './services/geminiService';
import { IGAReport } from './types';
import { Globe, BookOpen, Map as MapIcon, ChevronRight, FileText, GitCompare, X, GraduationCap, Building2, FlaskConical } from 'lucide-react';

// Simple Router State
enum Page {
  HOME,
  MAP,
  METHODOLOGY,
  COMPARE
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportData, setReportData] = useState<IGAReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);
  
  // Stores the stability level of countries that have been analyzed
  const [analyzedCountries, setAnalyzedCountries] = useState<Record<string, string>>({});

  // Comparison State
  const [comparisonList, setComparisonList] = useState<IGAReport[]>([]);

  const handleCountryClick = useCallback(async (countryName: string) => {
    setSelectedCountry(countryName);
    setIsSidebarOpen(true);
    setLoadingReport(true);
    setErrorReport(null);
    setReportData(null); // Reset previous data

    try {
      const data = await fetchCountryAnalysis(countryName);
      setReportData(data);
      
      // Update the map colors with the new result
      setAnalyzedCountries(prev => ({
        ...prev,
        [countryName]: data.stabilityLevel
      }));

    } catch (err) {
      setErrorReport("Não foi possível gerar o relatório IGA. Verifique a chave API ou tente novamente.");
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleAddToCompare = (data: IGAReport) => {
    if (comparisonList.find(c => c.countryName === data.countryName)) return;
    
    if (comparisonList.length >= 3) {
      alert("Máximo de 3 países para comparação.");
      return;
    }

    setComparisonList(prev => [...prev, data]);
  };

  const handleRemoveFromCompare = (countryName: string) => {
    setComparisonList(prev => prev.filter(c => c.countryName !== countryName));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-geo-text bg-geo-dark selection:bg-geo-accent selection:text-white">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-geo-dark/95 backdrop-blur z-40 sticky top-0">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCurrentPage(Page.HOME)}
        >
          <Globe className="text-geo-accent group-hover:rotate-180 transition-transform duration-700" size={28} />
          <h1 className="text-xl font-serif font-bold tracking-tight text-white group-hover:text-geo-accent transition-colors hidden md:block">
            Catálogo da Geopolítica de África
          </h1>
           <h1 className="text-xl font-serif font-bold tracking-tight text-white group-hover:text-geo-accent transition-colors md:hidden">
            IGA
          </h1>
        </div>
        <nav className="ml-auto flex gap-4 md:gap-8">
          <button 
            onClick={() => setCurrentPage(Page.HOME)}
            className={`text-sm font-medium transition-colors ${currentPage === Page.HOME ? 'text-geo-accent' : 'text-slate-400 hover:text-white'}`}
          >
            Sobre
          </button>
           <button 
            onClick={() => setCurrentPage(Page.METHODOLOGY)}
            className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentPage === Page.METHODOLOGY ? 'text-geo-accent' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText size={16} className="hidden sm:block"/>
            Metodologia
          </button>
          <button 
             onClick={() => setCurrentPage(Page.MAP)}
             className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentPage === Page.MAP ? 'text-geo-accent' : 'text-slate-400 hover:text-white'}`}
          >
            <MapIcon size={16} className="hidden sm:block"/>
            Mapa IGA
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden overflow-y-auto">
        {currentPage === Page.HOME && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[url('https://images.unsplash.com/photo-1543187127-14e4b5182937?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-geo-dark/85"></div> {/* Overlay */}
            
            <div className="relative z-10 max-w-3xl space-y-8 animate-in fade-in zoom-in duration-700 -mt-20">
              <span className="text-geo-accent font-bold tracking-[0.2em] uppercase text-xs md:text-sm border border-geo-accent px-4 py-2 rounded-full inline-block mb-4">
                Inteligência Estratégica & Análise de Dados
              </span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                Entenda o <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Poder</span> em África
              </h2>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Bem-vindo ao Índice Geopolítico Africano (IGA). Esta plataforma utiliza algoritmos avançados para mapear a estabilidade, influência económica e dinâmica de conflitos nas 54 nações do continente.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button 
                  onClick={() => setCurrentPage(Page.MAP)}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-geo-accent font-sans rounded-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 shadow-lg shadow-amber-900/20"
                >
                  <MapIcon className="mr-3" />
                  Aceder ao Mapa
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                 <button 
                  onClick={() => setCurrentPage(Page.METHODOLOGY)}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-800 border border-slate-700 font-sans rounded-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600 hover:border-slate-500"
                >
                  <FileText className="mr-3" />
                  Metodologia
                </button>
              </div>
            </div>
            
            {/* Institutional Footer */}
            <div className="absolute bottom-0 w-full border-t border-slate-800/50 bg-geo-dark/95 backdrop-blur z-20">
              <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start text-left">
                  
                  {/* Primary Institution */}
                  <div className="space-y-3">
                    <h3 className="text-geo-accent font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                      <Building2 size={14} /> Desenvolvimento
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Desenvolvido pelo <strong className="text-white font-semibold">Grupo de Pesquisa em Sistemas Inteligentes</strong> do <strong className="text-white font-semibold">Instituto de Estudos Avançados em Ciências, Engenharias e Tecnologias (INEACET)</strong>.
                    </p>
                  </div>

                  {/* Context & Support */}
                  <div className="space-y-3">
                    <h3 className="text-geo-accent font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                      <FlaskConical size={14} /> Aplicação
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Ferramenta oficial de trabalho para o <strong className="text-white font-semibold">Laboratório de Estudos Avançados em Segurança Internacional e Globalização</strong> do INEACET.
                    </p>
                  </div>

                  {/* Partners */}
                  <div className="space-y-3">
                    <h3 className="text-geo-accent font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                      <GraduationCap size={14} /> Colaboração Académica
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Com a participação de investigadores, docentes e estudantes da <span className="text-white">Academia de Ciências Sociais e Tecnologias (ACITE)</span> e do <span className="text-white">Instituto Superior de Angola (ISA)</span>.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === Page.MAP && (
          <div className="w-full h-full animate-in fade-in duration-500">
            <AfricaMap 
              onCountryClick={handleCountryClick} 
              countryStatusMap={analyzedCountries}
            />
          </div>
        )}

        {currentPage === Page.METHODOLOGY && (
          <div className="w-full h-full overflow-y-auto bg-geo-dark">
            <MethodologyPage />
          </div>
        )}

        {currentPage === Page.COMPARE && (
          <div className="w-full h-full overflow-y-auto bg-geo-dark">
            <ComparisonPage 
              countries={comparisonList} 
              onRemove={handleRemoveFromCompare}
            />
          </div>
        )}
      </main>

      {/* Comparison Tray */}
      {comparisonList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur border border-geo-accent/50 rounded-xl shadow-2xl p-4 flex items-center gap-4 pointer-events-auto animate-in slide-in-from-bottom-6">
            <div className="flex -space-x-2">
              {comparisonList.map((c) => (
                <div key={c.countryName} className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white overflow-hidden" title={c.countryName}>
                  {c.countryName.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {comparisonList.length < 3 && (
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 border-dashed flex items-center justify-center text-slate-500">
                  <span className="text-xs">+</span>
                </div>
              )}
            </div>
            
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">{comparisonList.length}</span>/3 Países
            </div>

            <div className="h-6 w-px bg-slate-700"></div>

            <button 
              onClick={() => setCurrentPage(Page.COMPARE)}
              className="bg-geo-accent hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <GitCompare size={16} />
              Comparar
            </button>

            <button 
              onClick={() => setComparisonList([])}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        countryName={selectedCountry}
        data={reportData}
        loading={loadingReport}
        error={errorReport}
        onCompare={handleAddToCompare}
        isComparing={!!reportData && comparisonList.some(c => c.countryName === reportData.countryName)}
      />
    </div>
  );
};

export default App;