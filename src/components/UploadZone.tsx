import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image, FileCode, CheckCircle, AlertCircle, Loader2, Sparkles, FolderUp } from 'lucide-react';
import { StudentSubmission } from '../types';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  onOpenGoogleDrive: () => void;
  isProcessing: boolean;
  activeCount: number;
  totalCount: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  onOpenGoogleDrive,
  isProcessing,
  activeCount,
  totalCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div id="upload-zone" className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Групово качване и проверка на предадени файлове
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Качете едновременно работите на целия клас (.pdf, .docx, .txt, Google Документи или снимки) от компютъра или от Google Drive.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenGoogleDrive}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            Качи от Google Drive
          </button>
          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Зареди 4 примерни (Демо)
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900">
            {isDragging
              ? 'Пуснете файловете тук'
              : 'Провлачете файловете тук или натиснете за избор'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
            Поддържа се едновременно качване на множество файлове.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-medium text-slate-600">
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              PDF документи (.pdf)
            </span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Word документи (.docx)
            </span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-slate-600" />
              Текстови файлове (.txt)
            </span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-emerald-600" />
              Снимки / скриншоти (.png, .jpg)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              <FolderUp className="w-4 h-4" />
              Избери файлове от компютъра
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGoogleDrive();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              Импорт от Google Drive
            </button>
          </div>
        </div>
      </div>

      {/* Progress display during batch processing */}
      {isProcessing && (
        <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 animate-in fade-in">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-indigo-950 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              Анализиране с Gemini AI...
            </span>
            <span className="text-xs font-mono font-medium text-indigo-800 tabular-nums">
              {activeCount} от {totalCount} файла
            </span>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
