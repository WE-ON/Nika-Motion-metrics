import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Treemap,
  ReferenceLine,
  Cell
} from 'recharts';
import { ProjectMeta } from '../types';
import Card from './ui/Card';
import { COLORS } from '../constants';

interface Props {
  projectMeta: Record<string, ProjectMeta>;
}

// Custom Colors for Efficiency
const EFFICIENCY_COLORS = {
  HIGH: COLORS.charts.work, // #8884d8
  MEDIUM: COLORS.charts.comm, // #ff9f40
  LOW: COLORS.charts.other // #9ca3af
};

const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 70) return EFFICIENCY_COLORS.HIGH;
  if (efficiency >= 50) return EFFICIENCY_COLORS.MEDIUM;
  return EFFICIENCY_COLORS.LOW;
};

const CustomTooltipScatter = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow text-xs text-white z-50">
        <p className="font-bold mb-1">{data.name}</p>
        <p>Часов: <span className="text-gray-300">{data.totalHours.toFixed(1)}</span></p>
        <p>Эффективность: <span style={{ color: getEfficiencyColor(data.efficiency) }}>{data.efficiency.toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

const CustomTreemapContent = (props: any) => {
  const { depth, x, y, width, height, name, efficiency } = props;

  // Safety check: skip rendering if data is missing (e.g. root node)
  if (!name || typeof efficiency !== 'number') return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: getEfficiencyColor(efficiency),
          fillOpacity: 0.8
          ,
          stroke: '#193133',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1,
        }}
      />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#1f2937"
          stroke="none"
          fontSize={14}
          fontWeight="bold"
          dy={-6}
        >
          {name.length > 15 ? name.substring(0, 15) + '..' : name}
        </text>
      )}
      {width > 60 && height > 30 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="#374151"
            stroke="none"
            fontSize={13}
            fontWeight="bold"
            dy={10}
          >
              {efficiency.toFixed(0)}%
          </text>
      )}
    </g>
  );
};

const ProjectComparison: React.FC<Props> = ({ projectMeta }) => {
  const [viewMode, setViewMode] = useState<'scatter' | 'treemap'>('treemap');

  // Prepare data
  const data = React.useMemo(() => {
    return Object.values(projectMeta)
      .filter(p => p.totalHours > 1) // Filter out empty/noise projects
      .map(p => ({
        name: p.projectName,
        totalHours: p.totalHours,
        efficiency: p.averageEfficiency,
        size: p.totalHours // for treemap
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [projectMeta]);

  return (
    <Card 
        title="Сравнение проектов" 
        subtitle="Анализ эффективности и объема работ"
        className="min-h-[500px]"
    >
      <div className="flex justify-end mb-4">
        <div className="bg-[#003B46] p-1 rounded-lg inline-flex">
            <button
                onClick={() => setViewMode('scatter')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'scatter' 
                    ? 'bg-[#B5F836] text-[#003B46]' 
                    : 'text-gray-400 hover:text-white'
                }`}
            >
                Матрица (Scatter)
            </button>
            <button
                onClick={() => setViewMode('treemap')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'treemap' 
                    ? 'bg-[#B5F836] text-[#003B46]' 
                    : 'text-gray-400 hover:text-white'
                }`}
            >
                Карта (Treemap)
            </button>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'scatter' ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                        type="number" 
                        dataKey="totalHours" 
                        name="Часы" 
                        unit="ч" 
                        stroke="#a0aec0"
                        label={{ value: 'Объем работ (часы)', position: 'bottom', offset: 0,  }}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="efficiency" 
                        name="Эффективность" 
                        unit="%" 
                        stroke="#a0aec0"
                        domain={[0, 100]}
                        label={{ value: 'Эффективность (%)', angle: -90, position: 'insideLeft', fill: '#a0aec0' }}
                    />
                    <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine y={50} stroke={EFFICIENCY_COLORS.LOW} strokeDasharray="3 3" label={{ value: 'Min 50%', fill: EFFICIENCY_COLORS.LOW, position: 'insideTopLeft' }} />
                    <ReferenceLine y={70} stroke={EFFICIENCY_COLORS.HIGH} strokeDasharray="3 3" label={{ value: 'Target 70%', fill: EFFICIENCY_COLORS.HIGH, position: 'insideTopLeft' }} />
                    <Scatter name="Проекты" data={data} fill={COLORS.accent}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.efficiency)} />
                        ))}
                    </Scatter>
                </ScatterChart>
            ) : (
                <Treemap
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    animationDuration={400}
                    content={<CustomTreemapContent />}
                >
                    <Tooltip 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-gray-800 p-2 border border-gray-700 rounded text-xs text-white">
                                        <p className="font-bold">{d.name}</p>
                                        <p>Часов: {d.totalHours?.toFixed(0)}</p>
                                        <p>Эффективность: {d.efficiency?.toFixed(1)}%</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </Treemap>
            )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex gap-4 justify-center text-xs text-gray-400">
          <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: EFFICIENCY_COLORS.HIGH }}></span>
              <span>Высокая (&ge;70%)</span>
          </div>
          <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: EFFICIENCY_COLORS.MEDIUM }}></span>
              <span>Средняя (50-70%)</span>
          </div>
          <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: EFFICIENCY_COLORS.LOW }}></span>
              <span>Низкая (&lt;50%)</span>
          </div>
      </div>
    </Card>
  );
};

export default ProjectComparison;
