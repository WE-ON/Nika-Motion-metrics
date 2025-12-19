import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DailyStats } from '../types';
import { COLORS } from '../constants';
import Card from './ui/Card';

interface Props {
  data: DailyStats[];
}

const ActivityChart: React.FC<Props> = ({ data }) => {
  // Transform data to percentages
  const chartData = data.map(d => {
    const total = d.total || 1; // Avoid division by zero
    return {
      date: d.date,
      workPct: (d.work / total) * 100,
      commPct: (d.comm / total) * 100,
      otherPct: (d.other / total) * 100,
      totalHours: d.total,
      uniqueUsers: d.uniqueUsers
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // payload order follows the stack order defined in the chart
      // We want to show Work, Comm, Other in a logical order in tooltip
      // Let's find them by dataKey to be sure
      const pWork = payload.find((p: any) => p.dataKey === 'workPct');
      const pComm = payload.find((p: any) => p.dataKey === 'commPct');
      const pOther = payload.find((p: any) => p.dataKey === 'otherPct');

      return (
        <div className="bg-[#193133] p-4 border border-gray-600 rounded-xl shadow-2xl text-xs text-white backdrop-blur-md">
          <p className="font-bold mb-3 text-base border-b border-gray-600 pb-2">{label}</p>
          <div className="space-y-1">
             {pWork && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: pWork.color}}></span>
                    Работа:
                </span>
                <span className="font-mono font-bold">{pWork.value.toFixed(1)}%</span>
              </div>
            )}
             {pComm && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: pComm.color}}></span>
                    Коммуникации:
                </span>
                <span className="font-mono font-bold">{pComm.value.toFixed(1)}%</span>
              </div>
            )}
             {pOther && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: pOther.color}}></span>
                    Прочее:
                </span>
                <span className="font-mono font-bold">{pOther.value.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-600 text-gray-400 space-y-1">
            <div className="flex justify-between">
                <span>Всего часов:</span>
                <span className="font-mono text-white">{payload[0].payload.totalHours.toFixed(1)} ч.</span>
            </div>
            {payload[0].payload.uniqueUsers !== undefined && (
                 <div className="flex justify-between">
                    <span>Пользователей:</span>
                    <span className="font-mono text-white">{payload[0].payload.uniqueUsers}</span>
                </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
        title="Детализация активности (%)" 
        subtitle="Распределение рабочего времени по категориям"
    >
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.charts.work} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.charts.work} stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.charts.comm} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.charts.comm} stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.charts.other} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.charts.other} stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={true} />
            <XAxis 
                dataKey="date" 
                stroke="#718096" 
                tick={{fill: '#718096', fontSize: 11}}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                minTickGap={30}
            />
            <YAxis 
                stroke="#718096" 
                tick={{fill: '#718096', fontSize: 11}}
                domain={[0, 100]}
                allowDecimals={false}
                tickCount={6}
                tickFormatter={(value) => `${Math.floor(Number(value))}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
                wrapperStyle={{ paddingTop: '20px' }} 
                iconType="circle"
            />
            
            {/* 
              Stack Order:
              1. Work (Bottom)
              2. Comm (Middle)
              3. Other (Top)
            */}
             <Area 
                type="monotone" 
                dataKey="workPct" 
                name="Работа" 
                stackId="1" 
                stroke={COLORS.charts.work} 
                strokeWidth={2}
                fill="url(#colorWork)" 
                animationDuration={1000}
            />
            <Area 
                type="monotone" 
                dataKey="commPct" 
                name="Коммуникации" 
                stackId="1" 
                stroke={COLORS.charts.comm} 
                strokeWidth={2}
                fill="url(#colorComm)" 
                animationDuration={1000}
            />
            <Area 
                type="monotone" 
                dataKey="otherPct" 
                name="Прочее" 
                stackId="1" 
                stroke={COLORS.charts.other} 
                strokeWidth={2}
                fill="url(#colorOther)" 
                animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ActivityChart;