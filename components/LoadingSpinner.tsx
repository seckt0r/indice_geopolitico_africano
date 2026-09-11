import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4 p-8">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-geo-panel rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-geo-accent rounded-full animate-spin border-t-transparent"></div>
    </div>
    <p className="text-geo-accent font-mono text-sm animate-pulse">
      Consultando Satélites e Bases de Dados...
    </p>
  </div>
);
