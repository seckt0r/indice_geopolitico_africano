import React, { useState } from 'react';

export interface Institution {
  /** Sigla, usada como chave e como monograma de recurso. */
  sigla: string;
  /** Nome por extenso, mostrado como legenda e usado no texto alternativo. */
  nome: string;
  /** Caminho do ficheiro em `public/instituicoes/`. */
  ficheiro: string;
  /** Endereço institucional, quando exista. */
  url?: string;
}

interface InstitutionLogoProps {
  instituicao: Institution;
}

/**
 * Logótipo de uma instituição parceira.
 *
 * O ficheiro de imagem pode não existir ainda. Em vez de deixar um quadrado
 * partido, o componente recai num monograma tipográfico com a sigla: a caixa
 * fica com o aspecto certo desde já e passa a mostrar o logótipo real assim
 * que o ficheiro for colocado em `public/instituicoes/`, sem tocar no código.
 *
 * Os logótipos são propriedade das respectivas instituições e por isso não são
 * gerados nem aproximados aqui — ou é o ficheiro oficial, ou é o monograma.
 */
export const InstitutionLogo: React.FC<InstitutionLogoProps> = ({ instituicao }) => {
  const [semImagem, setSemImagem] = useState(false);

  const conteudo = semImagem ? (
    <span className="font-serif text-lg font-bold tracking-tight text-geo-primary" aria-hidden="true">
      {instituicao.sigla}
    </span>
  ) : (
    <img
      src={instituicao.ficheiro}
      alt={`Logótipo: ${instituicao.nome}`}
      loading="lazy"
      className="max-h-10 w-auto max-w-full object-contain"
      onError={() => setSemImagem(true)}
    />
  );

  const caixa = (
    <span className="flex h-16 w-full items-center justify-center rounded-lg border border-geo-line bg-geo-surface px-3 transition-colors group-hover:border-geo-strong">
      {conteudo}
    </span>
  );

  return (
    <div className="group min-w-0">
      {instituicao.url ? (
        <a
          href={instituicao.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          title={instituicao.nome}
        >
          {caixa}
        </a>
      ) : (
        caixa
      )}
      <p className="mt-2 text-center text-[11px] leading-snug text-geo-muted">
        {/* A sigla fica visível mesmo quando há imagem: o monograma é apenas
            um recurso, não a identificação da instituição. */}
        <span className="font-semibold text-geo-body">{instituicao.sigla}</span>
        <span className="sr-only">, </span>
        <span className="block">{instituicao.nome}</span>
      </p>
    </div>
  );
};
