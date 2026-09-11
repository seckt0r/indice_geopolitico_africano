import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IGAReport, Language } from '../types';
import { PILLARS } from '../utils/pillars';
import { t } from '../utils/translations';

interface RadarChartProps {
  data: IGAReport[];
  colors: string[];
  language: Language;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, colors, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 400;
    const margin = 70; // espaço para os rótulos traduzidos, que são mais longos
    const radius = Math.min(width, height) / 2 - margin;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);
    const angleSlice = (Math.PI * 2) / PILLARS.length;
    const levels = [20, 40, 60, 80, 100];

    g.selectAll('.grid-circle')
      .data(levels)
      .enter()
      .append('circle')
      .attr('class', 'grid-circle')
      .attr('r', (d) => rScale(d))
      .style('fill', 'none')
      .style('stroke', '#d9d3c6')
      .style('stroke-dasharray', '4,4')
      .style('stroke-width', '0.5px');

    g.selectAll('.level-label')
      .data(levels)
      .enter()
      .append('text')
      .attr('class', 'level-label')
      .attr('x', 4)
      .attr('y', (d) => -rScale(d))
      .attr('dy', '0.4em')
      .style('font-size', '10px')
      .attr('fill', '#6e7887')
      .text((d) => d.toString());

    const axis = g.selectAll('.axis').data(PILLARS).enter().append('g').attr('class', 'axis');

    axis
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (_d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#cec7b8')
      .attr('stroke-width', '1px');

    // Os rótulos dos eixos passaram a ser traduzidos. Antes eram abreviaturas
    // fixas em inglês (Econ, Pol, Sec, Int, Hist) em todos os idiomas.
    axis
      .append('text')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('fill', '#3b4859')
      .attr('dy', '0.35em')
      .attr('x', (_d, i) => rScale(118) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_d, i) => rScale(118) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => t(d.shortKey, language));

    const radarLine = d3
      .line<{ value: number }>()
      .curve(d3.curveLinearClosed)
      .x((d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .y((d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));

    data.forEach((country, idx) => {
      const countryData = PILLARS.map((p) => ({ value: country.dimensions[p.key].score }));

      g.append('path')
        .datum(countryData)
        .attr('d', radarLine)
        .style('stroke-width', 2)
        .style('stroke', colors[idx])
        .style('fill', colors[idx])
        .style('fill-opacity', 0.12)
        .on('mouseover', function () {
          d3.select(this).style('fill-opacity', 0.28);
        })
        .on('mouseout', function () {
          d3.select(this).style('fill-opacity', 0.12);
        });

      g.selectAll(`.dot-${idx}`)
        .data(countryData)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr('r', 4)
        .style('fill', colors[idx])
        .style('stroke', '#ffffff')
        .style('stroke-width', 2);
    });
  }, [data, colors, language]);

  return <svg ref={svgRef} className="w-full h-full" />;
};
