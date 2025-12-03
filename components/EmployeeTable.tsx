import React, { useState } from 'react';
import { EmployeeStats } from '../types';
import Card from './ui/Card';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: EmployeeStats[];
}

type SortField = 'name' | 'efficiency' | 'totalHours' | 'workHours';
type SortDirection = 'asc' | 'desc';

const MIN_WORK_HOURS_THRESHOLD = 10;

const EmployeeTable: React.FC<Props> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('efficiency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortData = (list: EmployeeStats[]) => {
    return [...list].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      if (a[sortField] < b[sortField]) return -1 * modifier;
      if (a[sortField] > b[sortField]) return 1 * modifier;
      return 0;
    });
  };

  // Split data based on threshold
  const activeEmployees = data.filter(e => e.workHours >= MIN_WORK_HOURS_THRESHOLD);
  const insufficientDataEmployees = data.filter(e => e.workHours < MIN_WORK_HOURS_THRESHOLD);

  const sortedActive = sortData(activeEmployees);
  const sortedInsufficient = sortData(insufficientDataEmployees);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1 text-[#B5F836]" /> : 
      <ArrowDown className="w-4 h-4 ml-1 text-[#B5F836]" />;
  };

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 75) return 'text-[#10b981]'; // High green
    if (eff >= 60) return 'text-[#B5F836]'; // Mid lime
    return 'text-[#e17055]'; // Low red
  };

  // Reusable Table Header (Desktop)
  const TableHeader = () => (
    <thead className="bg-[#193133]">
      <tr>
        <th 
          scope="col" 
          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition"
          onClick={() => handleSort('name')}
        >
          <div className="flex items-center">
            Сотрудник
            <SortIcon field="name" />
          </div>
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition"
          onClick={() => handleSort('efficiency')}
        >
          <div className="flex items-center justify-end">
            Эффективность
            <SortIcon field="efficiency" />
          </div>
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition"
          onClick={() => handleSort('workHours')}
        >
            <div className="flex items-center justify-end">
            Часы (Работа)
            <SortIcon field="workHours" />
          </div>
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition"
          onClick={() => handleSort('totalHours')}
        >
            <div className="flex items-center justify-end">
            Всего часов
            <SortIcon field="totalHours" />
          </div>
        </th>
      </tr>
    </thead>
  );

  // Reusable Row Renderer (Desktop)
  const renderRow = (employee: EmployeeStats, idx: number) => (
    <tr key={employee.name} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-white/5'}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
        {employee.name}
        <div className="text-xs text-gray-400">{employee.role}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <span className={`font-bold ${getEfficiencyColor(employee.efficiency)}`}>
          {employee.efficiency.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
        {employee.workHours.toFixed(1)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
        {employee.totalHours.toFixed(1)}
      </td>
    </tr>
  );

  // Mobile Card Renderer
  const MobileCard = ({ employee }: { employee: EmployeeStats }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div 
        className="bg-[#193133]/50 border border-gray-700/50 rounded-xl p-4 mb-3 active:scale-[0.99] transition-transform"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white text-sm truncate">{employee.name}</div>
            <div className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">{employee.role}</div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className={`font-bold text-lg ${getEfficiencyColor(employee.efficiency)}`}>
              {employee.efficiency.toFixed(0)}%
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-500 mt-1" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-4 animate-fade-in">
             <div className="bg-black/20 rounded p-2 text-center">
                <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Часы (Работа)</div>
                <div className="text-white font-mono text-sm">{employee.workHours.toFixed(1)}</div>
             </div>
             <div className="bg-black/20 rounded p-2 text-center">
                <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Всего часов</div>
                <div className="text-white font-mono text-sm">{employee.totalHours.toFixed(1)}</div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card 
        title="Эффективность сотрудников" 
        subtitle="Ключевые показатели за выбранный период"
    >
      {/* DESKTOP VIEW */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-gray-700 mb-8">
            <table className="min-w-full divide-y divide-gray-700 bg-black/20">
            <TableHeader />
            <tbody className="divide-y divide-gray-700">
                {sortedActive.map((employee, idx) => renderRow(employee, idx))}
                {sortedActive.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Нет сотрудников с активностью более {MIN_WORK_HOURS_THRESHOLD} ч.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Secondary Table (Insufficient Data) - Desktop */}
        {sortedInsufficient.length > 0 && (
            <div className="opacity-80 mt-8">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500/80" />
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Недостаточно данных (менее {MIN_WORK_HOURS_THRESHOLD} ч. работы)
                </h4>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
                <table className="min-w-full divide-y divide-gray-700/50 bg-black/10">
                <TableHeader />
                <tbody className="divide-y divide-gray-700/50">
                    {sortedInsufficient.map((employee, idx) => renderRow(employee, idx))}
                </tbody>
                </table>
            </div>
            </div>
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden">
        {/* Mobile Controls (Simple sort toggle) */}
        <div className="flex justify-end mb-4">
             <button 
               onClick={() => handleSort('efficiency')}
               className="flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full"
             >
                Сортировка: Эффективность <SortIcon field="efficiency" />
             </button>
        </div>

        <div className="space-y-1">
            {sortedActive.map(e => <MobileCard key={e.name} employee={e} />)}
            
            {sortedActive.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    Нет сотрудников с активностью более {MIN_WORK_HOURS_THRESHOLD} ч.
                </div>
            )}
        </div>

        {/* Secondary List (Insufficient Data) - Mobile */}
        {sortedInsufficient.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-700/50">
                 <div className="flex items-center gap-2 mb-4 opacity-70">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase">
                    Недостаточно данных ({sortedInsufficient.length})
                    </h4>
                </div>
                <div className="space-y-1 opacity-60">
                    {sortedInsufficient.map(e => <MobileCard key={e.name} employee={e} />)}
                </div>
            </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-right">
        * Эффективность = Рабочие часы / Общие часы
      </div>
    </Card>
  );
};

export default EmployeeTable;
