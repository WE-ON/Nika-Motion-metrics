import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ActivityChart from './components/ActivityChart';
import ProjectTrendChart from './components/ProjectTrendChart';
import ProjectComparison from './components/ProjectComparison';
import EmployeeTable from './components/EmployeeTable';
import { parseCSV } from './utils/parser';
import { AggregatedData } from './types';
import { COLORS } from './constants';
import { Activity } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDataLoaded = (csvText: string) => {
    setLoading(true);
    // Simulate slight delay for UX
    setTimeout(() => {
        try {
            const parsed = parseCSV(csvText);
            setData(parsed);
        } catch (error) {
            console.error("Error parsing CSV", error);
            alert("Ошибка при чтении файла. Проверьте формат CSV.");
        } finally {
            setLoading(false);
        }
    }, 500);
  };

  const handleReset = () => {
    setData(null);
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
        {data && (
            <button 
                onClick={handleReset}
                className="px-6 py-2 rounded-full border border-[#B5F836] text-[#B5F836] hover:bg-[#B5F836] hover:text-[#193133] transition-all font-bold text-sm"
            >
                Загрузить другой файл
            </button>
        )}
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

             {/* Block 3: Employee Table */}
             <EmployeeTable data={data.employeeStats} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;