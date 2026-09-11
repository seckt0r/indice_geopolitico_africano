import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="relative h-12 w-12" role="status" aria-live="polite">
    <div className="absolute inset-0 rounded-full border-[3px] border-geo-line"></div>
    <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-geo-primary border-t-transparent"></div>
  </div>
);
