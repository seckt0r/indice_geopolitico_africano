import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CountryGeoFeature, MapTooltipData } from '../types';

interface AfricaMapProps {
  onCountryClick: (countryName: string) => void;
  countryStatusMap?: Record<string, string>;
}

// Color mapping for IGA Stability Levels
const STATUS_COLORS: Record<string, string> = {
  'Crítico': '#dc2626',      // Red 600
  'Instável': '#ea580c',     // Orange 600
  'Moderado': '#ca8a04',     // Yellow 600
  'Estável': '#059669',      // Emerald 600
  'Muito Estável': '#2563eb' // Blue 600
};

const DEFAULT_FILL = "#1e293b"; // Slate 800
const HOVER_STROKE = "#ffffff";
const DEFAULT_STROKE = "#475569";

export const AfricaMap: React.FC<AfricaMapProps> = ({ onCountryClick, countryStatusMap = {} }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<CountryGeoFeature[] | null>(null);
  const [tooltip, setTooltip] = useState<MapTooltipData | null>(null);
  
  // Advanced Loading States
  const [loadingMap, setLoadingMap] = useState(true);
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Load GeoJSON data with progress simulation and timeout handling
  useEffect(() => {
    let isMounted = true;
    
    // Timer to trigger "slow loading" message after 2 seconds
    const slowLoadTimer = setTimeout(() => {
      if (isMounted) setShowSlowLoadingMessage(true);
    }, 2000);

    // Simulate progress bar (since we can't easily get real progress from simple fetch without headers)
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) return prev; // Stall at 90% until done
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    const fetchMapData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/africa.geojson');
        
        if (!response.ok) throw new Error('Failed to load map data');
        
        const data = await response.json();
        
        if (!isMounted) return;

        // Finish progress bar
        setLoadProgress(100);
        
        // Translate names to Portuguese
        const translator = new Intl.DisplayNames(['pt-PT'], { type: 'region' });
        
        const translatedFeatures = data.features.map((feature: any) => {
          let ptName = feature.properties.name;
          if (feature.properties.iso_a2) {
            try {
              ptName = translator.of(feature.properties.iso_a2) || ptName;
            } catch (e) {
              // Fallback to original name if ISO code is invalid
            }
          }
          // Manual overrides for common issues or personal preference if needed
          if (feature.properties.name === "Eswatini") ptName = "Essuatíni";
          
          return {
            ...feature,
            properties: {
              ...feature.properties,
              name: ptName
            }
          };
        });

        setGeoData(translatedFeatures);
      } catch (err) {
        console.error("Map loading error:", err);
      } finally {
        if (isMounted) {
          // Small delay to let the progress bar hit 100% visually before unmounting loader
          setTimeout(() => {
            setLoadingMap(false);
            clearTimeout(slowLoadTimer);
            clearInterval(progressInterval);
          }, 500);
        }
      }
    };

    fetchMapData();

    return () => {
      isMounted = false;
      clearTimeout(slowLoadTimer);
      clearInterval(progressInterval);
    };
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial measurement

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle D3 Rendering
  useEffect(() => {
    if (!geoData || !svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous render
    svg.selectAll("*").remove();

    const geoJsonData = {
      type: "FeatureCollection",
      features: geoData
    };

    const projection = d3.geoMercator();
    const padding = 40; 
    projection.fitExtent(
      [[padding, padding], [width - padding, height - padding]], 
      geoJsonData as any
    );

    const pathGenerator = d3.geoPath().projection(projection);
    const g = svg.append("g");

    // Draw Countries
    g.selectAll("path")
      .data(geoData)
      .enter()
      .append("path")
      .attr("d", pathGenerator as any)
      .attr("class", "country-path cursor-pointer transition-all duration-300 ease-in-out")
      .attr("fill", (d) => {
        const status = countryStatusMap[d.properties.name];
        return status ? STATUS_COLORS[status] : DEFAULT_FILL;
      })
      .attr("stroke", DEFAULT_STROKE)
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        // Use current color as base, but brighten or outline
        d3.select(this)
          .attr("stroke", HOVER_STROKE)
          .attr("stroke-width", 1.5)
          .raise();

        setTooltip({
          x: event.pageX,
          y: event.pageY,
          name: d.properties.name
        });
      })
      .on("mousemove", function(event) {
         setTooltip(prev => prev ? ({ ...prev, x: event.pageX, y: event.pageY }) : null);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .attr("stroke", DEFAULT_STROKE)
          .attr("stroke-width", 0.5);
        setTooltip(null);
      })
      .on("click", (event, d) => {
        // Simple visual feedback
        d3.select(event.currentTarget)
           .transition().duration(100)
           .attr("fill", "#ffffff")
           .transition().duration(300)
           .attr("fill", () => {
             const status = countryStatusMap[d.properties.name];
             return status ? STATUS_COLORS[status] : "#d97706"; // Amber as 'loading/selected' temporary
           });
           
        onCountryClick(d.properties.name);
      });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

  }, [geoData, dimensions, onCountryClick, countryStatusMap]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-geo-dark overflow-hidden">
      
      {/* Robust Loading State */}
      {loadingMap && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-geo-dark z-50">
          <div className="w-64 space-y-4">
            {/* Spinner */}
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-geo-accent rounded-full animate-spin"></div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-geo-accent transition-all duration-300 ease-out" 
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>

            {/* Text Message */}
            <p className="text-center text-sm font-mono text-geo-muted animate-pulse">
              {showSlowLoadingMessage ? 'Carregando dados cartográficos...' : 'Iniciando sistema...'}
            </p>
          </div>
        </div>
      )}
      
      <svg 
        ref={svgRef} 
        className="w-full h-full block"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed pointer-events-none bg-black/90 text-white text-xs px-3 py-2 rounded border border-slate-600 shadow-xl z-[100] transform -translate-x-1/2 -translate-y-full mt-[-10px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-bold text-sm block mb-1">{tooltip.name}</span>
          {countryStatusMap[tooltip.name] ? (
             <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[countryStatusMap[tooltip.name]] }}></span>
               <span className="text-gray-300">{countryStatusMap[tooltip.name]}</span>
             </div>
          ) : (
             <span className="text-[10px] text-gray-400 italic">Clique para análise IGA</span>
          )}
        </div>
      )}

      {/* Legend - MOVED TO BOTTOM LEFT */}
      <div className="absolute bottom-6 left-6 bg-geo-panel/95 backdrop-blur p-4 rounded border border-slate-700 shadow-xl pointer-events-none md:pointer-events-auto min-w-[180px]">
        <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider border-b border-slate-700 pb-2">
          Legenda IGA
        </h4>
        <div className="space-y-2">
          {Object.entries(STATUS_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{label}</span>
              <span 
                className="w-4 h-4 rounded shadow-sm border border-white/10" 
                style={{ backgroundColor: color }}
              ></span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1 mt-1 border-t border-slate-700/50">
            <span className="text-slate-500 italic">Não Analisado</span>
            <span className="w-4 h-4 rounded bg-slate-800 border border-slate-600"></span>
          </div>
        </div>
      </div>

      {/* Navigation Instructions - MOVED TO BOTTOM RIGHT */}
      <div className="absolute bottom-6 right-6 bg-geo-panel/90 backdrop-blur p-4 rounded border border-slate-700 shadow-xl pointer-events-none md:pointer-events-auto max-w-xs text-right md:text-left">
        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Navegação</h4>
        <ul className="text-xs text-slate-300 space-y-1.5">
          <li className="flex items-center justify-end md:justify-start gap-2">
             Clique num país para gerar relatório <span className="w-1.5 h-1.5 rounded-full bg-slate-400 order-first md:order-last"></span>
          </li>
          <li className="flex items-center justify-end md:justify-start gap-2">
             Zoom com roda do rato <span className="w-1.5 h-1.5 rounded-full bg-slate-400 order-first md:order-last"></span>
          </li>
        </ul>
      </div>

    </div>
  );
};