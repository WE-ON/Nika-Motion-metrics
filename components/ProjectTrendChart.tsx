import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
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
  projectTrends: Record<string, DailyStats[]>;
  projectList: string[];
}

const ProjectTrendChart: React.FC<Props> = ({ projectTrends, projectList }) => {
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    if (projectList.length > 0 && !selectedProject) {
      setSelectedProject(projectList[0]);
    }
  }, [projectList]);

  const data = selectedProject ? projectTrends[selectedProject] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow text-xs text-white">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }}>
              {p.name}: {p.value.toFixed(2)} ч.
            </p>
          ))}
          <p className="mt-2 pt-2 border-t border-gray-600 font-bold">Total: {payload[0].payload.total.toFixed(2)} ч.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
        title="Тренды по проектам" 
        subtitle="Динамика трудозатрат в часах"
    >
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Выберите проект</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-[#B5F836] focus:border-[#B5F836] sm:text-sm rounded-md bg-[#193133] text-white border"
        >
          {projectList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[400px] w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#a0aec0" 
                tick={{fill: '#a0aec0', fontSize: 12}}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis 
                stroke="#a0aec0" 
                tick={{fill: '#a0aec0', fontSize: 12}}
                label={{ value: 'Часов', angle: -90, position: 'insideLeft', fill: '#a0aec0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="work" name="Работа" stackId="a" fill={COLORS.charts.work} />
              <Bar dataKey="comm" name="Коммуникации" stackId="a" fill={COLORS.charts.comm} />
              <Bar dataKey="other" name="Прочее" stackId="a" fill={COLORS.charts.other} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Нет данных для выбранного проекта
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProjectTrendChart;