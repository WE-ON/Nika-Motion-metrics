import React, { useState, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import ActivityChart from './components/ActivityChart';
import ProjectTrendChart from './components/ProjectTrendChart';
import ProjectComparison from './components/ProjectComparison';
import UserComparison from './components/UserComparison';
import EmployeeTable from './components/EmployeeTable';
import { parseCSV, aggregateData, FilterOptions } from './utils/parser';
import { RawRecord } from './types';
import { COLORS } from './constants';
import { Activity, Settings, Filter, X } from 'lucide-react';

const App: React.FC = () => {
  const [rawRecords, setRawRecords] = useState<RawRecord[] | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minDailyHours: 10,
    maxWorkPercent: 97
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const data = useMemo(() => {
    if (!rawRecords) return null;
    return aggregateData(rawRecords, filterOptions);
  }, [rawRecords, filterOptions]);

  const handleDataLoaded = (csvText: string) => {
    setLoading(true);
    // Simulate slight delay for UX
    setTimeout(() => {
        try {
            const records = parseCSV(csvText);
            setRawRecords(records);
        } catch (error) {
            console.error("Error parsing CSV", error);
            alert("Ошибка при чтении файла. Проверьте формат CSV.");
        } finally {
            setLoading(false);
        }
    }, 500);
  };

  const handleReset = () => {
    setRawRecords(null);
  };

  return (
    <div 
        className="min-h-screen pb-20"
        style={{ backgroundColor: COLORS.backgroundDark }}
    >
      {/* Header / Logo */}
      <header className="pt-8 pb-6 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 bg-[#193133] px-6 py-3 rounded-full shadow-lg border border-white/5">
            <Activity className="w-8 h-8 text-[#B5F836]" />
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Comfortaa' }}>
                    NIKA <span style={{ color: COLORS.accent }}>MOTION</span>
                </h1>
            </div>
        </div>
        <div className="flex gap-4">
            {data && (
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${
                        showFilters 
                        ? 'bg-[#B5F836] text-[#193133] border-[#B5F836]' 
                        : 'border-white/20 text-gray-300 hover:text-white hover:border-white'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    <span>Фильтры</span>
                </button>
            )}
            {data && (
                <button 
                    onClick={handleReset}
                    className="px-6 py-2 rounded-full border border-[#B5F836] text-[#B5F836] hover:bg-[#B5F836] hover:text-[#193133] transition-all font-bold text-sm"
                >
                    Загрузить другой файл
                </button>
            )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8">
        {!data ? (
          <div className="mt-20 max-w-2xl mx-auto animate-fade-in">
             <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Аналитика производительности</h2>
                <p className="text-xl text-gray-400">Загрузите данные для визуализации эффективности команды</p>
             </div>
             <FileUpload onDataLoaded={handleDataLoaded} />
             {loading && <div className="text-center text-[#B5F836] mt-4">Обработка данных...</div>}
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
             
             {/* Filters Panel */}
             {showFilters && (
                 <div className="bg-[#193133] p-6 rounded-2xl border border-white/10 shadow-xl mb-6 animate-fade-in">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Filter className="w-5 h-5 text-[#B5F836]" />
                            Настройка фильтрации аномалий
                        </h3>
                        <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                     </div>
                     <p className="text-gray-400 text-sm mb-6">
                         Исключить из расчетов дни, которые соответствуют следующим критериям. 
                         Это позволит убрать технические всплески и дни с неполными данными.
                     </p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">
                                 Минимальная активность (часов в день)
                             </label>
                             <div className="flex items-center gap-4">
                                 <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={filterOptions.minDailyHours} 
                                    onChange={(e) => setFilterOptions({...filterOptions, minDailyHours: Number(e.target.value)})}
                                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#B5F836]"
                                 />
                                 <input 
                                    type="number" 
                                    value={filterOptions.minDailyHours}
                                    onChange={(e) => setFilterOptions({...filterOptions, minDailyHours: Number(e.target.value)})}
                                    className="w-20 bg-[#003B46] border border-gray-600 rounded px-3 py-1 text-white text-center focus:border-[#B5F836] outline-none"
                                 />
                             </div>
                             <p className="text-xs text-gray-500 mt-2">
                                 Дни с суммарной активностью менее {filterOptions.minDailyHours} ч. будут исключены.
                             </p>
                         </div>

                         <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">
                                 Максимальная доля работы (%)
                             </label>
                             <div className="flex items-center gap-4">
                                 <input 
                                    type="range" 
                                    min="50" 
                                    max="100" 
                                    value={filterOptions.maxWorkPercent} 
                                    onChange={(e) => setFilterOptions({...filterOptions, maxWorkPercent: Number(e.target.value)})}
                                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#B5F836]"
                                 />
                                 <input 
                                    type="number" 
                                    value={filterOptions.maxWorkPercent}
                                    onChange={(e) => setFilterOptions({...filterOptions, maxWorkPercent: Number(e.target.value)})}
                                    className="w-20 bg-[#003B46] border border-gray-600 rounded px-3 py-1 text-white text-center focus:border-[#B5F836] outline-none"
                                 />
                             </div>
                             <p className="text-xs text-gray-500 mt-2">
                                 Дни, где "Работа" составляет &ge; {filterOptions.maxWorkPercent}%, будут исключены.
                             </p>
                         </div>
                     </div>
                 </div>
             )}

             {/* Stats Summary - Optional quick glance */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#003B46] p-6 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-sm mb-1">Всего сотрудников</div>
                    <div className="text-3xl font-bold text-white">{data.employeeStats.length}</div>
                </div>
                <div className="bg-[#003B46] p-6 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-sm mb-1">Активных проектов</div>
                    <div className="text-3xl font-bold text-white">{data.projectList.length}</div>
                </div>
                <div className="bg-[#003B46] p-6 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-sm mb-1">Всего часов</div>
                    <div className="text-3xl font-bold text-white">
                        {Math.round(data.employeeStats.reduce((acc, curr) => acc + curr.totalHours, 0))}
                    </div>
                </div>
                <div className="bg-[#003B46] p-6 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-sm mb-1">Средняя эффективность</div>
                    <div className="text-3xl font-bold text-[#B5F836]">
                        {(data.employeeStats.reduce((acc, curr) => acc + curr.efficiency, 0) / (data.employeeStats.length || 1)).toFixed(1)}%
                    </div>
                </div>
             </div>

             {/* Block 1: Detailed Percents */}
             <ActivityChart data={data.dailyPercents} />


             {/* Block 1.5: Project Comparison Dashboard */}
             <ProjectComparison projectMeta={data.projectMeta} />

             {/* Block 2: Project Trends */}
             <ProjectTrendChart 
                projectTrends={data.projectTrends} 
                projectList={data.projectList}
                projectMeta={data.projectMeta}
             />

             {/* Block 2.5: User Comparison Dashboard */}
             <UserComparison employees={data.employeeStats} />

             {/* Block 3: Employee Table */}
             <EmployeeTable data={data.employeeStats} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;