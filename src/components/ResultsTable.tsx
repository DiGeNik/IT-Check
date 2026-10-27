import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileSpreadsheet,
  Eye,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  GraduationCap,
  Sparkles,
  Image as ImageIcon,
  CheckCheck,
  X,
} from 'lucide-react';
import { StudentSubmission } from '../types';
import { calculateBulgarianGrade, copyToClipboard } from '../utils/exportUtils';

interface ResultsTableProps {
  submissions: StudentSubmission[];
  topicTitle: string;
  maxScore: number;
  onInspect: (submission: StudentSubmission) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onClearAll: () => void;
  onExport: () => void;
  onRetry: (submission: StudentSubmission) => void;
  onOpenSettings: () => void;
  onRegradeAll?: () => void;
  onLoadSamples?: () => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  submissions,
  topicTitle,
  maxScore,
  onInspect,
  onDelete,
  onDeleteMultiple,
  onClearAll,
  onExport,
  onRetry,
  onOpenSettings,
  onRegradeAll,
  onLoadSamples,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAllComments, setCopiedAllComments] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '6' | '5' | '4' | 'below4'>('all');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'images' | 'docs'>('all');
  const [notification, setNotification] = useState<{ message: string; type?: 'info' | 'success' | 'danger' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showNotice = (message: string, type: 'info' | 'success' | 'danger' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const handleCopyComment = async (submission: StudentSubmission) => {
    if (!submission.classroomComment) return;
    const success = await copyToClipboard(submission.classroomComment);
    if (success) {
      setCopiedId(submission.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === submission.id ? null : prev));
      }, 2500);
    }
  };

  const handleCopyAllComments = async () => {
    const valid = submissions.filter((s) => s.status === 'completed' && s.classroomComment);
    if (!valid.length) return;
    const allText = valid
      .map((s, idx) => `[${idx + 1}] ${s.studentName}:\n${s.classroomComment}\n`)
      .join('\n-------------------------\n\n');
    await copyToClipboard(allText);
    setCopiedAllComments(true);
    showNotice(`Копирани са коментарите на всички ${valid.length} ученици за Google Classroom!`, 'success');
    setTimeout(() => {
      setCopiedAllComments(false);
    }, 2500);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (filteredSubmissions.length > 0 && filteredSubmissions.every((s) => selectedIds.includes(s.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    if (onDeleteMultiple) {
      onDeleteMultiple(selectedIds);
    } else {
      selectedIds.forEach((id) => onDelete(id));
    }
    setSelectedIds([]);
    showNotice(`Успешно премахнати ${count} ${count === 1 ? 'файл' : 'файла'}.`, 'danger');
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const isImageFile =
      /\.(jpe?g|png|webp|gif|bmp)$/i.test(s.fileName) || s.fileType?.startsWith('image/');

    if (fileTypeFilter === 'images' && !isImageFile) return false;
    if (fileTypeFilter === 'docs' && isImageFile) return false;

    if (gradeFilter === 'all') return true;
    const { numeric } = calculateBulgarianGrade(s.totalScore, s.maxScore || maxScore);
    if (gradeFilter === '6') return numeric === 6;
    if (gradeFilter === '5') return numeric === 5;
    if (gradeFilter === '4') return numeric === 4;
    if (gradeFilter === 'below4') return numeric < 4;
    return true;
  });

  const imageSubmissionsCount = submissions.filter(
    (s) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(s.fileName) || s.fileType?.startsWith('image/')
  ).length;
  const docSubmissionsCount = submissions.length - imageSubmissionsCount;

  // Calculate statistics
  const completed = submissions.filter((s) => s.status === 'completed');
  const avgPoints =
    completed.length > 0
      ? (completed.reduce((acc, s) => acc + s.totalScore, 0) / completed.length).toFixed(1)
      : '0.0';
  const maxAchieved = completed.length > 0 ? Math.max(...completed.map((s) => s.totalScore)) : 0;
  const gradeSixCount = completed.filter(
    (s) => calculateBulgarianGrade(s.totalScore, s.maxScore || maxScore).numeric === 6
  ).length;

  if (submissions.length === 0) {
    return (
      <div id="results-table" className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center mt-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Все още няма проверени работи
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Качете файлове от компютъра, изберете папка от Google Drive или кликнете бутона по-долу, за да заредите 4 примерни ученически протокола и да видите пълната таблица с резултатите веднага.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onLoadSamples && (
            <button
              onClick={onLoadSamples}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Зареди 4 примерни работи (Демо)
            </button>
          )}
          <a
            href="#upload-zone"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
          >
            Към зоната за качване
          </a>
        </div>
      </div>
    );
  }

  return (
    <div id="results-table" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      {/* Header and Controls */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Резултати от оценяването
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
                {submissions.length} {submissions.length === 1 ? 'ученик' : 'ученици'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>Тема: <strong className="text-slate-800">{topicTitle}</strong></span>
              <span>·</span>
              <span className="font-mono text-indigo-700 font-semibold">макс {maxScore} т.</span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="ml-1 text-indigo-600 hover:text-indigo-800 underline font-medium inline-flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                (промени)
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl shadow-sm">
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  title="Премахни маркираните файлове от списъка веднага"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Премахни избраните ({selectedIds.length})
                </button>
                <span className="text-rose-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-[11px] text-rose-600 hover:underline cursor-pointer font-medium"
                >
                  Размаркирай
                </button>
              </div>
            )}
            {onRegradeAll && completed.length > 0 && (
              <button
                type="button"
                onClick={onRegradeAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                title="Преоцени всички качени работи според актуалната рубрика"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                Преоцени всички
              </button>
            )}
            <button
              onClick={handleCopyAllComments}
              disabled={completed.length === 0}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 cursor-pointer ${
                copiedAllComments
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
              title="Копирай всички индивидуални коментари наведнъж"
            >
              {copiedAllComments ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  Копирани! ✓
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  Копирай всички коментари
                </>
              )}
            </button>
            <button
              onClick={onExport}
              disabled={completed.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Експорт в Excel (CSV)
            </button>
            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg">
                <span className="text-xs text-rose-800 font-medium">Изчисти всички?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setSelectedIds([]);
                    setShowClearConfirm(false);
                    showNotice('Всички резултати бяха изчистени.', 'info');
                  }}
                  className="px-2 py-0.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
                >
                  Отказ
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                title="Изчисти всички резултати от таблицата"
              >
                Изчисти
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Notification Banner */}
        {notification && (
          <div
            className={`mt-4 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in transition-all ${
              notification.type === 'danger'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : notification.type === 'danger' ? (
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 ml-3 font-bold cursor-pointer"
              title="Затвори"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stats Strip */}
        {completed.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Проверени работи</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {completed.length} / {submissions.length}
              </div>
            </div>
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="text-xs text-indigo-700 font-medium">Среден брой точки</div>
              <div className="text-xl font-bold text-indigo-950 mt-0.5 tabular-nums">
                {avgPoints} <span className="text-xs font-normal text-indigo-600">/ {maxScore} т.</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium">Отличен (6)</div>
              <div className="text-xl font-bold text-emerald-950 mt-0.5 tabular-nums">
                {gradeSixCount} <span className="text-xs font-normal text-emerald-600">ученици</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Максимален постигнат</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {maxAchieved} <span className="text-xs font-normal text-slate-500">/ {maxScore} т.</span>
              </div>
            </div>
          </div>
        )}

        {/* End of Header and Stats */}
      </div>

      {/* Prominent Search and Filter Section */}
      <div className="bg-slate-50/90 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-3.5">
          {/* Main Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-indigo-600" />
              </div>
              <input
                id="search-students-input"
                type="text"
                placeholder="🔍 Търсене на ученик по име или по име на файл (напр. Иван, протокол.docx, photo.jpg)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Изчисти търсенето"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-xs shrink-0">
              <span className="text-slate-500">Показани:</span>
              <span className="font-mono text-indigo-700 font-bold tabular-nums">
                {filteredSubmissions.length} от {submissions.length}
              </span>
            </div>
          </div>

          {/* Neutral Format & Grade Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Format Tabs (neutral styling, photos and docs treated equally) */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setFileTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  fileTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Всички формати ({submissions.length})
              </button>
              <button
                type="button"
                onClick={() => setFileTypeFilter('docs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  fileTypeFilter === 'docs'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 Документи ({docSubmissionsCount})
              </button>
              <button
                type="button"
                onClick={() => setFileTypeFilter('images')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  fileTypeFilter === 'images'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📷 Снимки ({imageSubmissionsCount})
              </button>
            </div>

            {/* Bulgarian Grade Filters */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setGradeFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  gradeFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Всички оценки
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('6')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  gradeFilter === '6'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                Отличен (6)
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('5')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  gradeFilter === '5'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                Мн. добър (5)
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('4')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  gradeFilter === '4'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                Добър (4)
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('below4')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  gradeFilter === 'below4'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                Под Добър
              </button>
            </div>

            {(searchQuery || gradeFilter !== 'all' || fileTypeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('all');
                  setFileTypeFilter('all');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium px-2 py-1 cursor-pointer"
              >
                Изчисти всички филтри
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 tracking-wide">
              <th scope="col" className="py-3.5 pl-5 pr-2 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    filteredSubmissions.length > 0 &&
                    filteredSubmissions.every((s) => selectedIds.includes(s.id))
                  }
                  onChange={handleSelectAllVisible}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer align-middle"
                  title="Маркирай / Размаркирай всички видими"
                />
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[200px]">
                Име на ученик
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[300px]">
                Разбивка по критерии / задачи
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[140px] text-center">
                <div>Общо точки</div>
                <div className="text-[10px] font-normal text-slate-500">макс {maxScore} т. · Оценка</div>
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 min-w-[240px] text-right">
                Действие
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {searchQuery
                        ? `Няма намерени ученици за "${searchQuery}"`
                        : 'Няма намерени резултати за избрания филтър'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Проверете правописа или натиснете бутона по-долу, за да видите всички качени работи.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setGradeFilter('all');
                        setFileTypeFilter('all');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Изчисти търсенето и филтрите
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((s) => {
                const subMax = s.maxScore || maxScore;
                const gradeInfo = calculateBulgarianGrade(s.totalScore, subMax);
                const isCopied = copiedId === s.id;
                const isAnalyzing = s.status === 'analyzing';
                const isError = s.status === 'error';
                const isSelected = selectedIds.includes(s.id);

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors group ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/80'}`}
                  >
                    {/* Чекбокс за избор */}
                    <td className="py-4 pl-5 pr-2 align-top text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(s.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer mt-1"
                        title="Избери за групово премахване"
                      />
                    </td>

                    {/* Име на ученик */}
                    <td className="py-4 px-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 mt-0.5 border border-slate-200">
                          {s.studentName ? s.studentName.charAt(0) : '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {s.studentName || 'Неразпознато име'}
                            {s.isManuallyEdited && (
                              <span className="ml-1.5 text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                коригирано
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5 flex flex-wrap items-center gap-1.5">
                            {/\.(jpe?g|png|webp|gif|bmp)$/i.test(s.fileName) || s.fileType?.startsWith('image/') ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-0.5">
                                📷 Снимка
                              </span>
                            ) : s.fileName.toLowerCase().endsWith('.pdf') ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                PDF
                              </span>
                            ) : s.fileName.toLowerCase().endsWith('.docx') ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Word
                              </span>
                            ) : null}
                            <span className="font-mono text-slate-600">{s.fileName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{(s.fileSize / 1024).toFixed(0)} KB</span>
                          </div>
                          {isError && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <div className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{s.errorMessage || 'Грешка при проверка'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRetry(s)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors cursor-pointer"
                                title="Повторна проверка на този файл"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Опитай отново</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Разбивка по критерии / задачи */}
                    <td className="py-4 px-3 align-top">
                      {isAnalyzing ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 animate-pulse">
                          Извличане и оценка на отговорите...
                        </div>
                      ) : isError ? (
                        <span className="text-xs text-rose-500 font-mono">—</span>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {s.tasks && s.tasks.length > 0 ? (
                              s.tasks.map((t, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700"
                                  title={t.feedback}
                                >
                                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                                    {t.taskName}:
                                  </span>
                                  <span className="font-mono font-bold text-indigo-700 tabular-nums">
                                    {t.score}/{t.maxScore}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Няма разбивка</span>
                            )}
                          </div>
                          {s.details?.statusSummary && (
                            <p className="text-[11px] text-slate-500 italic truncate max-w-md">
                              {s.details.statusSummary}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Общо точки и Оценка */}
                    <td className="py-4 px-4 text-center align-top">
                      {isAnalyzing ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 animate-pulse">
                          Анализира се
                        </div>
                      ) : isError ? (
                        <button
                          onClick={() => onRetry(s)}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" /> Опитай отново
                        </button>
                      ) : (
                        <div>
                          <div className="text-base font-bold text-slate-950 font-mono tabular-nums">
                            {s.totalScore}{' '}
                            <span className="text-xs font-normal text-slate-500">/ {subMax}</span>
                          </div>
                          <div
                            className={`text-xs font-semibold mt-0.5 ${
                              gradeInfo.numeric === 6
                                ? 'text-emerald-700'
                                : gradeInfo.numeric === 5
                                ? 'text-blue-700'
                                : gradeInfo.numeric === 4
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {gradeInfo.grade} ({gradeInfo.numeric})
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Действие */}
                    <td className="py-4 pl-3 pr-6 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        {/* Бутон Копирай коментар за Classroom */}
                        {s.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleCopyComment(s)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                              isCopied
                                ? 'bg-emerald-600 text-white shadow-emerald-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                            }`}
                            title="Копирай индивидуален насърчителен коментар за Google Classroom"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Копирано! ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Копирай за Classroom</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Бутон Опитай отново при грешка */}
                        {s.status === 'error' && (
                          <button
                            type="button"
                            onClick={() => onRetry(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors cursor-pointer"
                            title="Повторна проверка на този файл"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Опитай отново</span>
                          </button>
                        )}

                        {/* Бутон Преглед / Редакция */}
                        <button
                          type="button"
                          onClick={() => onInspect(s)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          title="Преглед на детайли и ръчна корекция на точките"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Бутон Изтрий */}
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(s.id);
                            setSelectedIds((prev) => prev.filter((id) => id !== s.id));
                            showNotice(`Файлът "${s.fileName}" беше премахнат.`, 'info');
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Премахни този файл от списъка"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
