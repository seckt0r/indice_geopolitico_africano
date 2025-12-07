import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IGAReport } from '../types';

interface RadarChartProps {
  data: IGAReport[];
  colors: string[];
}

const PILLARS = [
  { key: 'economic', label: 'Económico' },
  { key: 'political', label: 'Político' },
  { key: 'security', label: 'Segurança' },
  { key: 'international', label: 'Internacional' },
  { key: 'history', label: 'Histórico' },
];

export const RadarChart: React.FC<RadarChartProps> = ({ data, colors }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 400;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

    // Center the chart
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Scales
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);
    const angleSlice = (Math.PI * 2) / PILLARS.length;

    // Draw the Grid (Concentric circles)
    const levels = [20, 40, 60, 80, 100];
    
    // Grid circles
    g.selectAll(".grid-circle")
      .data(levels)
      .enter()
      .append("circle")
      .attr("class", "grid-circle")
      .attr("r", (d) => rScale(d))
      .style("fill", "none")
      .style("stroke", "#334155") // Slate-700
      .style("stroke-dasharray", "4,4")
      .style("stroke-width", "0.5px");

    // Text indicating levels
    g.selectAll(".axis-label")
      .data(levels)
      .enter()
      .append("text")
      .attr("x", 4)
      .attr("y", (d) => -rScale(d))
      .attr("dy", "0.4em")
      .style("font-size", "10px")
      .attr("fill", "#64748b") // Slate-500
      .text((d) => d.toString());

    // Draw Axes (Lines radiating from center)
    const axis = g.selectAll(".axis")
      .data(PILLARS)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#475569")
      .attr("stroke-width", "1px");

    // Draw Axis Labels
    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(115) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(115) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d.label);

    // Draw Data Polygons
    const radarLine = d3.line<any>()
      .curve(d3.curveLinearClosed)
      .x((d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .y((d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));

    data.forEach((country, idx) => {
      const countryData = PILLARS.map(p => ({ 
        axis: p.label, 
        value: (country.pillars as any)[p.key].score 
      }));

      // Area
      g.append("path")
        .datum(countryData)
        .attr("d", radarLine)
        .style("stroke-width", 2)
        .style("stroke", colors[idx])
        .style("fill", colors[idx])
        .style("fill-opacity", 0.15)
        .on("mouseover", function() {
           d3.select(this).style("fill-opacity", 0.5);
        })
        .on("mouseout", function() {
           d3.select(this).style("fill-opacity", 0.15);
        });

      // Dots
      g.selectAll(`.dot-${idx}`)
        .data(countryData)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("r", 4)
        .style("fill", colors[idx])
        .style("stroke", "#0f172a")
        .style("stroke-width", 2);
    });

  }, [data, colors]);

  return <svg ref={svgRef} className="w-full h-full" />;
};
