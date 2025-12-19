import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
  ReferenceArea
} from 'recharts';
import { EmployeeStats } from '../types';
import Card from './ui/Card';
import { COLORS } from '../constants';

interface Props {
  employees: EmployeeStats[];
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
        <p className="text-gray-400 mb-1">{data.role}</p>
        <p>Часов: <span className="text-gray-300">{data.totalHours.toFixed(1)}</span></p>
        <p>Эффективность: <span style={{ color: getEfficiencyColor(data.efficiency) }}>{data.efficiency.toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

const UserComparison: React.FC<Props> = ({ employees }) => {
  // Zoom state
  const [refAreaLeft, setRefAreaLeft] = useState<string | number>('');
  const [refAreaRight, setRefAreaRight] = useState<string | number>('');
  const [refAreaTop, setRefAreaTop] = useState<string | number>('');
  const [refAreaBottom, setRefAreaBottom] = useState<string | number>('');
  
  const [left, setLeft] = useState<string | number>('auto');
  const [right, setRight] = useState<string | number>('auto');
  const [top, setTop] = useState<string | number>(100);
  const [bottom, setBottom] = useState<string | number>(0);
  
  // Animation key to force re-render when zooming
  const [animationKey, setAnimationKey] = useState(0);

  // Prepare data
  const data = React.useMemo(() => {
    return employees
      .filter(p => p.totalHours > 1) // Filter out empty/noise
      .map(p => ({
        name: p.name,
        role: p.role,
        totalHours: p.totalHours,
        efficiency: p.efficiency,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [employees]);

  const maxHours = data.length > 0 ? Math.max(...data.map(d => d.totalHours)) : 0;

  const zoom = () => {
    let newLeft = refAreaLeft;
    let newRight = refAreaRight;
    let newTop = refAreaTop;
    let newBottom = refAreaBottom;

    if (newLeft === newRight || newTop === newBottom) {
      setRefAreaLeft('');
      setRefAreaRight('');
      setRefAreaTop('');
      setRefAreaBottom('');
      return;
    }

    // Ensure correct order (min/max) for domains
    if (newLeft > newRight) [newLeft, newRight] = [newRight, newLeft];
    if (newBottom > newTop) [newBottom, newTop] = [newTop, newBottom];

    setRefAreaLeft('');
    setRefAreaRight('');
    setRefAreaTop('');
    setRefAreaBottom('');
    
    setLeft(newLeft);
    setRight(newRight);
    setBottom(newBottom);
    setTop(newTop);
    setAnimationKey(prev => prev + 1);
  };

  const zoomOut = () => {
    setRefAreaLeft('');
    setRefAreaRight('');
    setRefAreaTop('');
    setRefAreaBottom('');
    setLeft('auto');
    setRight('auto');
    setTop(100);
    setBottom(0);
    setAnimationKey(prev => prev + 1);
  };

  return (
    <Card 
        title="Сравнение пользователей" 
        subtitle="Анализ эффективности сотрудников и объема работ"
        className="min-h-[500px] select-none"
    >
      <div className="flex justify-end mb-4">
        {/* Zoom Out Button (only visible when zoomed) */}
        {(left !== 'auto' || right !== 'auto' || top !== 100 || bottom !== 0) && (
            <button
                onClick={zoomOut}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-[#B5F836] text-[#003B46] hover:bg-[#a3e635] transition-colors"
            >
                Сбросить зум
            </button>
        )}
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart 
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                onMouseDown={(e: any) => {
                    if (e) {
                        setRefAreaLeft(e.xValue);
                        setRefAreaTop(e.yValue);
                    }
                }}
                onMouseMove={(e: any) => {
                    if (e && refAreaLeft) {
                        setRefAreaRight(e.xValue);
                        setRefAreaBottom(e.yValue);
                    }
                }}
                onMouseUp={zoom}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                    type="number" 
                    dataKey="totalHours" 
                    name="Часы" 
                    unit="ч" 
                    stroke="#a0aec0"
                    // If 'auto', we use log scale for better distribution
                    // If zoomed, we might switch to number or keep log but with specific domain
                    scale={left === 'auto' ? "log" : "linear"}
                    domain={[left, right]}
                    allowDataOverflow
                    tickFormatter={(value) => Number(value).toFixed(0)}
                    label={{ value: 'Объем работ (часы)', position: 'bottom', offset: 0, fill: '#a0aec0' }}
                />
                <YAxis 
                    type="number" 
                    dataKey="efficiency" 
                    name="Эффективность" 
                    unit="%" 
                    stroke="#a0aec0"
                    domain={[bottom, top]}
                    allowDataOverflow
                    tickFormatter={(value) => value.toFixed(1)}
                    label={{ value: 'Эффективность (%)', angle: -90, position: 'insideLeft', fill: '#a0aec0' }}
                />
                <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={50} stroke={EFFICIENCY_COLORS.LOW} strokeDasharray="3 3" label={{ value: 'Min 50%', fill: EFFICIENCY_COLORS.LOW, position: 'insideTopLeft' }} />
                <ReferenceLine y={70} stroke={EFFICIENCY_COLORS.HIGH} strokeDasharray="3 3" label={{ value: 'Target 70%', fill: EFFICIENCY_COLORS.HIGH, position: 'insideTopLeft' }} />
                
                {/* Max hours marker - only show if within view */}
                {left === 'auto' && (
                    <ReferenceLine 
                        x={maxHours} 
                        stroke="#718096" 
                        strokeDasharray="3 3" 
                        label={{ 
                            value: `${maxHours.toFixed(0)}ч`, 
                            position: 'bottom', 
                            fill: '#e2e8f0',
                            fontSize: 12,
                            dy: 10
                        }} 
                    />
                )}

                <Scatter name="Сотрудники" data={data} fill={COLORS.accent} key={animationKey}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.efficiency)} />
                    ))}
                    <LabelList 
                        dataKey="name" 
                        position="top" 
                        offset={5}
                        formatter={(value: string) => value.length > 8 ? `${value.substring(0, 8)}..` : value}
                        style={{ fill: '#e2e8f0', fontSize: '10px', pointerEvents: 'none' }}
                    />
                </Scatter>
                
                {/* Selection Rectangle */}
                {refAreaLeft && refAreaRight ? (
                    <ReferenceArea 
                        x1={refAreaLeft} 
                        x2={refAreaRight} 
                        y1={refAreaTop}
                        y2={refAreaBottom}
                        strokeOpacity={0.3} 
                        fill="#B5F836"
                        fillOpacity={0.1}
                    />
                ) : null}
            </ScatterChart>
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

export default UserComparison;
