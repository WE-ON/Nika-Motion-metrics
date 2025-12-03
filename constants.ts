export const COLORS = {
  backgroundDark: '#193133',
  backgroundLight: '#003B46',
  accent: '#B5F836',
  accentHover: '#9fd82f',
  textLight: '#ffffff',
  textDim: '#a0aec0',
  charts: {
    work: '#8884d8', // Purple/Blue tone
    comm: '#ff9f40', // Orange tone
    other: '#9ca3af', // Gray tone
  }
};

export const ACTIVITY_TYPES = {
  WORK: 'Работа',
  COMM: 'Коммуникации',
  OTHER: 'Прочее', // Fallback for everything else
};

export const CSV_HEADERS = [
  'День',
  'Проект',
  'Тип активности',
  'Сотрудник',
  'Должность',
  'Программа',
  'Часов',
  'Сессий'
];