import { Sparkles, FileSpreadsheet, BookOpen, Layers, Sliders, Search } from 'lucide-react';

interface TopNavProps {
  onLoadSamples: () => void;
  onOpenRubric: () => void;
  onOpenGoogleDrive: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
  activeTopicTitle: string;
  activeMaxScore: number;
  hasSubmissions: boolean;
  totalSubmissions: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onLoadSamples,
  onOpenRubric,
  onOpenGoogleDrive,
  onOpenSettings,
  onExport,
  activeTopicTitle,
  activeMaxScore,
  hasSubmissions,
  totalSubmissions,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200 font-bold text-lg">
              IT
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                AutoGrade IT
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium">
                · Универсална проверка
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            <a
              href="#upload-zone"
              className="hover:text-slate-900 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              Качване на файлове
            </a>
            <button
              onClick={onOpenGoogleDrive}
              className="hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1.5 text-left font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              Google Drive
            </button>
            <button
              onClick={onOpenSettings}
              className="hover:text-indigo-600 transition-colors whitespace-nowrap flex items-center gap-1.5 text-left text-indigo-700 font-semibold"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              Критерии и рубрика ({activeMaxScore} т.)
            </button>
            <a
              href="#results-table"
              className="hover:text-slate-900 transition-colors whitespace-nowrap flex items-center gap-1.5 text-slate-700 font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              Проверени работи ({totalSubmissions})
            </a>
            {hasSubmissions && (
              <a
                href="#results-table"
                onClick={() => {
                  setTimeout(() => {
                    document.getElementById('search-students-input')?.focus();
                  }, 120);
                }}
                className="hover:text-indigo-600 text-indigo-700 transition-colors whitespace-nowrap flex items-center gap-1.5 text-left font-medium text-xs bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer"
                title="Отиди директно на търсачката в таблицата с резултати"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                Търси ученик
              </a>
            )}
            {hasSubmissions && (
              <button
                onClick={onExport}
                className="hover:text-emerald-700 text-emerald-800 transition-colors whitespace-nowrap flex items-center gap-1.5 text-left font-semibold"
              >
                Експорт в Excel
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Settings trigger */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
              title="Редактирай критериите за оценяване и еталонните отговори"
            >
              <Sliders className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Настройки на рубриката</span>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                {activeMaxScore} т.
              </span>
            </button>

            <button
              type="button"
              onClick={onLoadSamples}
              className="px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 border border-indigo-200"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Примерни</span> (Демо)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
