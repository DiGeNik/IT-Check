import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Save,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { StudentSubmission, TaskScoreItem } from '../types';
import { calculateBulgarianGrade, copyToClipboard } from '../utils/exportUtils';

interface StudentDetailModalProps {
  submission: StudentSubmission | null;
  topicTitle: string;
  maxScore: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: StudentSubmission) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  submission,
  topicTitle,
  maxScore,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !submission) return null;

  const [studentName, setStudentName] = useState(submission.studentName);
  const [tasks, setTasks] = useState<TaskScoreItem[]>(submission.tasks || []);
  const [classroomComment, setClassroomComment] = useState(submission.classroomComment);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    setStudentName(submission.studentName);
    setTasks(submission.tasks || []);
    setClassroomComment(submission.classroomComment);
    setIsCopied(false);
  }, [submission]);

  const currentTotal = tasks.reduce((acc, t) => acc + (Number(t.score) || 0), 0);
  const subMax = submission.maxScore || maxScore || 12;
  const gradeInfo = calculateBulgarianGrade(currentTotal, subMax);

  const handleTaskScoreChange = (index: number, newScore: number) => {
    setTasks((prev) => {
      const next = [...prev];
      const maxVal = next[index].maxScore || 10;
      next[index] = {
        ...next[index],
        score: Math.min(maxVal, Math.max(0, newScore)),
      };
      return next;
    });
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(classroomComment);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleRegenerateComment = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          tasks,
          totalScore: currentTotal,
          maxScore: subMax,
          topicTitle,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        setClassroomComment(data.comment);
      }
    } catch (err) {
      console.error('Failed to regenerate comment:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveAndClose = () => {
    const updated: StudentSubmission = {
      ...submission,
      studentName,
      tasks,
      totalScore: currentTotal,
      maxScore: subMax,
      classroomComment,
      isManuallyEdited: true,
    };
    onSave(updated);
    onClose();
  };

  const details = submission.details;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Детайлна проверка
              </span>
              <span className="text-xs text-slate-500 font-mono">{submission.fileName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {studentName || 'Ученик'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Quick Score Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-medium">Общ резултат от проверката</div>
              <div className="text-2xl font-bold font-mono tracking-tight mt-0.5 tabular-nums">
                {currentTotal} / {subMax} точки
              </div>
              <div className="text-xs text-indigo-300 font-medium mt-0.5">
                Оценка: {gradeInfo.grade} ({gradeInfo.numeric}) · Тема: {topicTitle}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tasks.map((t, i) => (
                <div key={i} className="text-center px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{t.taskName}</div>
                  <div className="text-sm font-bold font-mono text-white tabular-nums">
                    {t.score} / {t.maxScore}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Name Input */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Име и фамилия на ученика:
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Dynamic Tasks / Criteria List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Оценка по задачи и критерии</span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Няма отделни критерии.</p>
            ) : (
              tasks.map((task, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">
                      {task.taskName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-slate-600 font-medium">Точки:</label>
                      <input
                        type="number"
                        min="0"
                        max={task.maxScore}
                        value={task.score}
                        onChange={(e) => handleTaskScoreChange(idx, Number(e.target.value))}
                        className="w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-mono">/ {task.maxScore}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    <strong className="text-slate-800">Обратна връзка: </strong>
                    {task.feedback}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Submitted text preview if available */}
          {submission.textContent && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Предадено съдържание от ученика ({submission.fileName}):
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {submission.textContent.length} символа
                </span>
              </div>
              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200 max-h-[160px] overflow-y-auto leading-relaxed">
                {submission.textContent}
              </pre>
            </div>
          )}

          {/* Strengths & Weaknesses if available */}
          {details && (details.strengths || details.weaknesses) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {details.strengths && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Силни страни:</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed">{details.strengths}</p>
                </div>
              )}
              {details.weaknesses && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Пропуски и грешки:</span>
                  </div>
                  <p className="text-amber-900 leading-relaxed">{details.weaknesses}</p>
                </div>
              )}
            </div>
          )}

          {/* Individual Classroom Comment */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-700" />
                <h4 className="font-bold text-indigo-950 text-sm">
                  Индивидуален насърчителен коментар за Google Classroom
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateComment}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {isRegenerating ? 'Прегенериране...' : 'Прегенерирай с AI'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Копирано!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Копирай
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={classroomComment}
              onChange={(e) => setClassroomComment(e.target.value)}
              className="w-full p-3 text-xs text-slate-800 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-sans"
              placeholder="Въведете или коригирайте коментара за ученика..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Отказ
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-100"
          >
            <Save className="w-3.5 h-3.5" />
            Запази промените
          </button>
        </div>
      </div>
    </div>
  );
};
