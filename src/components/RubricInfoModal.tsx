import React from 'react';
import { X, Award, FileCheck2, CheckCircle2, Sliders } from 'lucide-react';
import { AssignmentSettings } from '../types';

interface RubricInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssignmentSettings;
  onOpenSettings: () => void;
}

export const RubricInfoModal: React.FC<RubricInfoModalProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Активна рубрика за оценяване ({settings.maxScore} т.)
              </h2>
              <p className="text-xs text-slate-500">
                Тема: {settings.topicTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Active Topic Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Тема на проверката</div>
              <div className="text-base font-bold text-white mt-0.5">{settings.topicTitle}</div>
            </div>
            <div className="text-right sm:text-right shrink-0">
              <div className="text-xs text-slate-400">Максимален сбор</div>
              <div className="text-xl font-bold font-mono text-indigo-300 tabular-nums">
                {settings.maxScore} точки
              </div>
            </div>
          </div>

          {/* Rubric Criteria Text */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Критерии за оценяване (рубрика):</span>
            </div>
            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed max-h-[220px] overflow-y-auto">
              {settings.rubricCriteria}
            </pre>
          </div>

          {/* Reference Solution */}
          {settings.referenceSolution && settings.referenceSolution.trim() && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Еталонно решение или верни отговори:</span>
              </div>
              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-white p-3.5 rounded-lg border border-emerald-200 leading-relaxed max-h-[180px] overflow-y-auto">
                {settings.referenceSolution}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            Редактирай критериите и верните отговори
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
};
