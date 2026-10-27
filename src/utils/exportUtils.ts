import { StudentSubmission } from '../types';

export function calculateBulgarianGrade(points: number, maxPoints = 12): { grade: string; numeric: number } {
  if (maxPoints <= 0) return { grade: 'Отличен', numeric: 6 };
  const ratio = points / maxPoints;

  if (ratio >= 0.88) return { grade: 'Отличен', numeric: 6 };
  if (ratio >= 0.72) return { grade: 'Мн. добър', numeric: 5 };
  if (ratio >= 0.55) return { grade: 'Добър', numeric: 4 };
  if (ratio >= 0.38) return { grade: 'Среден', numeric: 3 };
  return { grade: 'Слаб', numeric: 2 };
}

export function exportToCSV(
  submissions: StudentSubmission[],
  topicTitle = 'ИТ_Резултати',
  maxScore = 12
) {
  if (!submissions.length) return;

  // Determine dynamic task column names across submissions
  const allTaskNames: string[] = [];
  submissions.forEach((s) => {
    s.tasks.forEach((t) => {
      if (!allTaskNames.includes(t.taskName)) {
        allTaskNames.push(t.taskName);
      }
    });
  });

  const headers = [
    'Име на ученик',
    ...allTaskNames.map((name) => `${name}`),
    `Общо точки (макс ${maxScore})`,
    'Оценка',
    'Коментар за Classroom',
    'Име на файл',
    'Статус',
  ];

  const escapeCSV = (value: string | number | undefined) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = submissions.map((s) => {
    const gradeInfo = calculateBulgarianGrade(s.totalScore, s.maxScore || maxScore);

    const taskScoreMap = new Map<string, number>();
    s.tasks.forEach((t) => taskScoreMap.set(t.taskName, t.score));

    const taskValues = allTaskNames.map((name) => {
      const val = taskScoreMap.get(name);
      return val !== undefined ? escapeCSV(val) : escapeCSV('-');
    });

    return [
      escapeCSV(s.studentName),
      ...taskValues,
      escapeCSV(`${s.totalScore} / ${s.maxScore || maxScore}`),
      escapeCSV(`${gradeInfo.grade} (${gradeInfo.numeric})`),
      escapeCSV(s.classroomComment),
      escapeCSV(s.fileName),
      escapeCSV(s.status === 'completed' ? 'Проверен' : s.status === 'error' ? 'Грешка' : 'В процес'),
    ].join(';');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel displays Cyrillic without garbled characters
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const safeTitle = topicTitle.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeTitle}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
