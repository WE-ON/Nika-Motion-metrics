import { RawRecord, AggregatedData, DailyStats, EmployeeStats, ProjectMeta } from '../types';

export interface FilterOptions {
  minDailyHours: number;
  maxWorkPercent: number;
}

export const parseCSV = (csvText: string): RawRecord[] => {
  // Remove BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText.trim().split('\n');
  const records: RawRecord[] = [];
  
  if (lines.length === 0) return [];

  // Detect separator from first line (comma or semicolon)
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  
  // Clean headers: remove quotes, trim, lowercase
  const headers = headerLine.split(separator).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  // Check if we found relevant headers
  const hasHeader = headers.some(h => 
    h.includes('день') || h.includes('date') || h.includes('сотрудник') || h.includes('часов')
  );

  // Default mapping based on user example
  let colMap = {
    date: 0,
    project: 1,
    activityType: 2,
    employee: 3,
    role: 4,
    program: 5,
    hours: 6,
    sessions: 7
  };

  let startIndex = 0;

  if (hasHeader) {
    startIndex = 1;
    // Dynamic mapping helper
    const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));
    
    // Mappings with fallback keywords
    const dateIdx = findIdx(['день', 'date']);
    const projectIdx = findIdx(['проект', 'project']);
    const activityIdx = findIdx(['тип активности', 'activity', 'тип']);
    const employeeIdx = findIdx(['сотрудник', 'employee', 'name', 'фио']);
    const roleIdx = findIdx(['должность', 'role', 'position']);
    const programIdx = findIdx(['программа', 'program', 'app']);
    const hoursIdx = findIdx(['часов', 'hours', 'time', 'duration']);
    const sessionsIdx = findIdx(['сессий', 'sessions']);

    // Only override if we found essential columns
    if (dateIdx !== -1 && hoursIdx !== -1) {
        colMap = {
            date: dateIdx !== -1 ? dateIdx : -1,
            project: projectIdx !== -1 ? projectIdx : -1,
            activityType: activityIdx !== -1 ? activityIdx : 2, // Default to 2 if not found but others found
            employee: employeeIdx !== -1 ? employeeIdx : -1,
            role: roleIdx !== -1 ? roleIdx : -1,
            program: programIdx !== -1 ? programIdx : -1,
            hours: hoursIdx !== -1 ? hoursIdx : -1,
            sessions: sessionsIdx !== -1 ? sessionsIdx : -1,
        };
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle split with potential quotes (basic regex for CSV)
    // If simple split fails, use a regex that ignores commas inside quotes
    let values = line.split(separator);
    if (line.includes('"')) {
        const regex = separator === ';' ? /(?:^|;)(?:"([^"]*)"|([^;]*))/g : /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
        const matches = [];
        let match;
        while ((match = regex.exec(line))) {
            matches.push(match[1] || match[2] || '');
        }
        if (matches.length > 1) values = matches;
    }
    
    // Helper to safely get value and clean strange whitespace like non-breaking spaces
    const getValue = (idx: number) => {
        if (idx === -1 || idx >= values.length) return '';
        return values[idx].trim().replace(/^"|"$/g, '').replace(/\s+/g, ' ');
    };
    
    const parseNumber = (val: string) => {
      if (!val) return 0;
      // Handle "0,28" -> 0.28 and "0.28" -> 0.28, remove non-numeric chars except dot/comma
      const cleanVal = val.replace(/[^0-9.,-]/g, '').replace(',', '.');
      return parseFloat(cleanVal) || 0;
    };

    records.push({
      date: getValue(colMap.date),
      project: getValue(colMap.project),
      activityType: getValue(colMap.activityType),
      employee: getValue(colMap.employee),
      role: getValue(colMap.role),
      program: getValue(colMap.program),
      hours: parseNumber(getValue(colMap.hours)),
      sessions: parseNumber(getValue(colMap.sessions)),
    });
  }

  return records;
};

export const aggregateData = (
  records: RawRecord[], 
  options: FilterOptions = { minDailyHours: 0, maxWorkPercent: 101 }
): AggregatedData => {
  const dailyMap = new Map<string, DailyStats>();
  const projectMap = new Map<string, Map<string, DailyStats>>();
  const employeeMap = new Map<string, EmployeeStats>();
  const projectSet = new Set<string>();
  // Track employees per project per day
  const projectEmployeeMap = new Map<string, Map<string, Set<string>>>();
  // Track global employees per day
  const dailyEmployeesMap = new Map<string, Set<string>>();
  // Track stats per employee per project for efficiency calculation
  const projectStatsMap = new Map<string, Map<string, { work: number, total: number }>>();

  // --- Step 1: Pre-calculate daily totals to identify excluded days ---
  const dailyTotals = new Map<string, { total: number, work: number }>();
  
  records.forEach(r => {
      if (!r.date || r.date.length < 5) return;
      if (!dailyTotals.has(r.date)) {
          dailyTotals.set(r.date, { total: 0, work: 0 });
      }
      const day = dailyTotals.get(r.date)!;
      day.total += r.hours;
      if (isWork(r.activityType)) {
          day.work += r.hours;
      }
  });

  const excludedDates = new Set<string>();
  dailyTotals.forEach((stats, date) => {
      // Filter 1: Min Daily Hours
      if (stats.total < options.minDailyHours) {
          excludedDates.add(date);
          return;
      }
      // Filter 2: Max Work Percent
      const workPct = stats.total > 0 ? (stats.work / stats.total) * 100 : 0;
      if (workPct >= options.maxWorkPercent) {
          excludedDates.add(date);
      }
  });

  // --- Step 2: Main Aggregation (Skipping excluded dates) ---
  records.forEach(r => {
    // Basic date validation
    if (!r.date || r.date.length < 5) return;
    
    // Skip excluded dates
    if (excludedDates.has(r.date)) return;

    // 1. Daily Aggregation (Global)
    if (!dailyMap.has(r.date)) {
      dailyMap.set(r.date, { date: r.date, work: 0, comm: 0, other: 0, total: 0 });
    }
    const dayStat = dailyMap.get(r.date)!;
    
    // 2. Project Aggregation
    if (r.project) {
        projectSet.add(r.project);
        if (!projectMap.has(r.project)) {
            projectMap.set(r.project, new Map());
        }
        const pMap = projectMap.get(r.project)!;
        if (!pMap.has(r.date)) {
            pMap.set(r.date, { date: r.date, work: 0, comm: 0, other: 0, total: 0 });
        }
        const pDayStat = pMap.get(r.date)!;
        
        updateStats(pDayStat, r.activityType, r.hours);

        // Track employees
        if (r.employee) {
            if (!projectEmployeeMap.has(r.project)) {
                projectEmployeeMap.set(r.project, new Map());
            }
            const pEmpMap = projectEmployeeMap.get(r.project)!;
            if (!pEmpMap.has(r.date)) {
                pEmpMap.set(r.date, new Set());
            }
            pEmpMap.get(r.date)!.add(r.employee);

            // Track stats for project efficiency
            if (!projectStatsMap.has(r.project)) {
                projectStatsMap.set(r.project, new Map());
            }
            const pStats = projectStatsMap.get(r.project)!;
            if (!pStats.has(r.employee)) {
                pStats.set(r.employee, { work: 0, total: 0 });
            }
            const empPStat = pStats.get(r.employee)!;
            if (isWork(r.activityType)) {
                empPStat.work += r.hours;
            }
            empPStat.total += r.hours;
        }
    }

    // 3. Employee Aggregation
    if (r.employee) {
        if (!employeeMap.has(r.employee)) {
            employeeMap.set(r.employee, {
                name: r.employee,
                role: r.role,
                workHours: 0,
                commHours: 0,
                otherHours: 0,
                totalHours: 0,
                efficiency: 0
            });
        }
        const empStat = employeeMap.get(r.employee)!;

        if (isWork(r.activityType)) empStat.workHours += r.hours;
        else if (isComm(r.activityType)) empStat.commHours += r.hours;
        else empStat.otherHours += r.hours;
        
        empStat.totalHours += r.hours;
    }

    updateStats(dayStat, r.activityType, r.hours);

    // 4. Track unique users for global daily stats
    if (r.employee) {
        if (!dailyEmployeesMap.has(r.date)) {
            dailyEmployeesMap.set(r.date, new Set());
        }
        dailyEmployeesMap.get(r.date)!.add(r.employee);
    }
  });


  // Finalize Employee Efficiency
  const employeeStats = Array.from(employeeMap.values()).map(e => ({
    ...e,
    efficiency: e.totalHours > 0 ? (e.workHours / e.totalHours) * 100 : 0
  }));

  // Sort daily stats
  const sortedDaily = Array.from(dailyMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
        ...d,
        uniqueUsers: dailyEmployeesMap.get(d.date)?.size || 0
    }));

  // Process Project Trends
  const projectTrends: Record<string, DailyStats[]> = {};
  projectMap.forEach((dateMap, projectName) => {
      const statsList = Array.from(dateMap.values());
      
      // Enrich with employees
      statsList.forEach(stat => {
        const pEmpMap = projectEmployeeMap.get(projectName);
        if (pEmpMap && pEmpMap.has(stat.date)) {
            stat.employees = Array.from(pEmpMap.get(stat.date)!);
        }
      });

      projectTrends[projectName] = statsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  // Calculate Project Meta (Average Efficiency)
  const projectMeta: Record<string, ProjectMeta> = {};
  projectSet.forEach(projectName => {
      const empMap = projectStatsMap.get(projectName);
      let averageEfficiency = 0;
      let totalHours = 0;

      // Calculate total hours from daily stats to ensure accuracy
      const pDailyStats = projectMap.get(projectName);
      if (pDailyStats) {
          pDailyStats.forEach(d => totalHours += d.total);
      }

      if (empMap) {
          let totalEfficiency = 0;
          let empCount = 0;
          empMap.forEach((stats) => {
              if (stats.total > 0) {
                  const eff = (stats.work / stats.total) * 100;
                  totalEfficiency += eff;
                  empCount++;
              }
          });
          averageEfficiency = empCount > 0 ? totalEfficiency / empCount : 0;
      }
      
      projectMeta[projectName] = {
          projectName,
          totalHours,
          averageEfficiency
      };
  });

  return {
    dailyPercents: sortedDaily,
    projectTrends,
    projectMeta,
    employeeStats,
    projectList: Array.from(projectSet).sort()
  };
};

// Robust keyword matching
const isWork = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('работ') || t.includes('work') || t.includes('prod') || t.includes('dev') || t.includes('проект');
};

const isComm = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('коммун') || t.includes('comm') || t.includes('meet') || t.includes('vks') || t.includes('mail') || t.includes('chat');
};

const updateStats = (stat: DailyStats, type: string, hours: number) => {
    if (isWork(type)) {
        stat.work += hours;
    } else if (isComm(type)) {
        stat.comm += hours;
    } else {
        stat.other += hours;
    }
    stat.total += hours;
};