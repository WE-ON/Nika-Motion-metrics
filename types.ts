export interface RawRecord {
  date: string;
  employee: string;
  role: string;
  program: string;
  activityType: string;
  project: string;
  hours: number;
  sessions: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  work: number;
  comm: number;
  other: number;
  total: number;
  employees?: string[]; // List of employees active on this day
}

export interface ProjectStats {
  projectName: string;
  dailyStats: DailyStats[];
}

export interface EmployeeStats {
  name: string;
  role: string;
  workHours: number;
  commHours: number;
  otherHours: number;
  totalHours: number;
  efficiency: number; // 0-100 percentage
}

export interface AggregatedData {
  dailyPercents: DailyStats[];
  projectTrends: Record<string, DailyStats[]>; // Map project name to daily stats
  employeeStats: EmployeeStats[];
  projectList: string[];
}