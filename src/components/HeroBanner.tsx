import React from 'react';
import { ArrowRight, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';

interface HeroBannerProps {
  topicTitle: string;
  maxScore: number;
  onScrollToUpload: () => void;
  onOpenSettings: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  topicTitle,
  maxScore,
  onScrollToUpload,
  onOpenSettings,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl mb-8">
      {/* Background radial gradient */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center relative z-10">
        {/* Left Column: Title and info */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Универсална проверка по всяка тема
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
            Автоматична групова проверка на предадени работни листи
          </h1>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 max-w-xl">
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Текущо активно задание:</span>
              <span className="font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">
                макс {maxScore} точки
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {topicTitle}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Качете работите на класа от компютъра или от Google Drive. Gemini ще оцени отговорите спрямо Вашата рубрика и еталонни решения и ще подготви индивидуални насърчителни коментари за Google Classroom.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onScrollToUpload}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span>Качи файлове за проверка</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 transition-colors inline-flex items-center gap-2"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Смени темата и критериите</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual illustration */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl group w-full max-h-[300px]">
            <img
              src="/src/assets/images/it_network_worksheet_hero_1793013186505.jpg"
              alt="Учебен процес по информационни технологии"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 bg-slate-900/80 px-2 py-0.5 rounded border border-indigo-500/30">
                Информационни технологии
              </span>
              <p className="text-xs text-slate-200 mt-1 font-medium">
                Анализ на PDF, Word (.docx), Google Документи и снимки
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
