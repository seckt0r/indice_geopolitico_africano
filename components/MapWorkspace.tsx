import React from 'react';
import { CountryRef, IGAReport, Language, ReportDataset, StabilityKey } from '../types';
import { AfricaMap } from './AfricaMap';
import { ReportPanel } from './ReportPanel';

interface MapWorkspaceProps {
  onCountryClick: (country: CountryRef) => void;
  countryStatusMap: Record<string, StabilityKey>;
  language: Language;
  selectedCountryName: string | null;
  report: IGAReport | null;
  loading: boolean;
  error: string | null;
  elapsedSeconds: number;
  progressChars: number;
  onCompare: (data: IGAReport) => void;
  isComparing: boolean;
  dataset: ReportDataset | null;
}

/**
 * Disposição do mapa: cartografia à esquerda, painel de relatório à direita.
 *
 * O painel é permanente, não uma gaveta. Com o índice pré-calculado, abrir um
 * país é instantâneo e esconder o painel entre cliques só acrescentava um
 * passo sem ganho nenhum.
 *
 * Em ecrãs estreitos a divisão passa a vertical: o mapa fica com uma altura
 * fixa em cima e o painel ocupa o resto, com scroll próprio. Lado a lado num
 * telemóvel daria duas colunas ilegíveis.
 */
export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  onCountryClick,
  countryStatusMap,
  language,
  selectedCountryName,
  report,
  loading,
  error,
  elapsedSeconds,
  progressChars,
  onCompare,
  isComparing,
  dataset,
}) => (
  <div className="flex h-full flex-col lg:flex-row">
    <div className="h-[42vh] shrink-0 border-b border-geo-line sm:h-[48vh] lg:h-full lg:min-w-0 lg:flex-1 lg:border-b-0 lg:border-r">
      <AfricaMap onCountryClick={onCountryClick} countryStatusMap={countryStatusMap} language={language} />
    </div>

    <aside className="min-h-0 flex-1 lg:h-full lg:w-[24rem] lg:flex-none xl:w-[28rem] 2xl:w-[32rem]">
      <ReportPanel
        countryName={selectedCountryName}
        data={report}
        loading={loading}
        error={error}
        elapsedSeconds={elapsedSeconds}
        progressChars={progressChars}
        onCompare={onCompare}
        isComparing={isComparing}
        language={language}
        dataset={dataset}
        statusMap={countryStatusMap}
      />
    </aside>
  </div>
);
