/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { HeroBanner } from './components/HeroBanner';
import { UploadZone } from './components/UploadZone';
import { ResultsTable } from './components/ResultsTable';
import { RubricInfoModal } from './components/RubricInfoModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { AssignmentSettingsModal, DEFAULT_PRESETS } from './components/AssignmentSettingsModal';
import { StudentSubmission, AssignmentSettings } from './types';
import { SAMPLE_WORKSHEETS } from './data/sampleWorksheets';
import { exportToCSV } from './utils/exportUtils';
import { analyzeWorksheetDirectly } from './services/geminiService';

export default function App() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('autograde_it_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalQueueCount, setTotalQueueCount] = useState(0);

  // Sync submissions to localStorage
  useEffect(() => {
    try {
      const compact = submissions.slice(0, 100).map((s) => ({
        ...s,
        fileBase64: undefined, // keep text and scores, omit large raw base64
      }));
      localStorage.setItem('autograde_it_submissions', JSON.stringify(compact));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, [submissions]);

  // Assignment & Rubric settings
  const [assignmentSettings, setAssignmentSettings] = useState<AssignmentSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('autograde_it_settings');
      if (savedSettings) return JSON.parse(savedSettings);
    } catch (e) {}
    return {
      topicTitle: DEFAULT_PRESETS[0].topicTitle,
      maxScore: DEFAULT_PRESETS[0].maxScore,
      rubricCriteria: DEFAULT_PRESETS[0].rubricCriteria,
      referenceSolution: DEFAULT_PRESETS[0].referenceSolution,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('autograde_it_settings', JSON.stringify(assignmentSettings));
    } catch (e) {}
  }, [assignmentSettings]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [inspectSubmission, setInspectSubmission] = useState<StudentSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Helper to read file as Base64 string
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Process a single submission item
  const analyzeSingleItem = async (
    item: StudentSubmission,
    customSettings?: AssignmentSettings
  ): Promise<StudentSubmission> => {
    const activeConf = customSettings || assignmentSettings;

    const payload: any = {
      fileName: item.fileName,
      fileType: item.fileType,
      assignmentTopic: activeConf.topicTitle,
      rubricCriteria: activeConf.rubricCriteria,
      referenceSolution: activeConf.referenceSolution,
      maxScore: activeConf.maxScore,
    };

    if (item.fileBase64) {
      payload.fileBase64 = item.fileBase64;
    }
    if (item.textContent) {
      payload.textContent = item.textContent;
    }

    let lastError: Error | null = null;

    // Retry up to 2 times for transient network glitches
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        const analysis = await analyzeWorksheetDirectly(payload);
        const tasks = Array.isArray(analysis.tasks) ? analysis.tasks : [];

        return {
          ...item,
          status: 'completed',
          studentName: analysis.studentName || item.studentName,
          totalScore: analysis.totalScore ?? 0,
          maxScore: analysis.maxScore || activeConf.maxScore,
          tasks: tasks,
          classroomComment: analysis.classroomComment || '',
          errorMessage: undefined,
          details: {
            tasks: tasks,
            strengths: analysis.strengths || '',
            weaknesses: analysis.weaknesses || '',
            statusSummary: analysis.statusSummary || '',
          },
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt + 1} failed for ${item.fileName}:`, err?.message || err);
      }
    }

    console.error('Error analyzing', item.fileName, lastError);
    return {
      ...item,
      status: 'error',
      errorMessage: lastError?.message || 'Възникна грешка при обработката на файла.',
    };
  };

  // Re-grade all submissions with new settings
  const regradeAllSubmissions = async (newSettings?: AssignmentSettings) => {
    if (submissions.length === 0) return;

    const conf = newSettings || assignmentSettings;
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalQueueCount(submissions.length);

    const snapshot = [...submissions];

    for (let i = 0; i < snapshot.length; i++) {
      const currentItem = snapshot[i];

      setSubmissions((prev) =>
        prev.map((s) => (s.id === currentItem.id ? { ...s, status: 'analyzing', errorMessage: undefined } : s))
      );

      const completed = await analyzeSingleItem(currentItem, conf);

      setSubmissions((prev) =>
        prev.map((s) => (s.id === completed.id ? completed : s))
      );

      setProcessedCount(i + 1);
    }

    setIsProcessing(false);
  };

  // Handle uploaded files
  const handleFilesSelected = async (files: File[]) => {
    if (!files.length) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalQueueCount(files.length);

    const initialItems: StudentSubmission[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const isTxt = file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain';

      let base64 = '';
      let text = '';

      try {
        if (isTxt) {
          text = await readFileAsText(file);
        } else {
          base64 = await readFileAsBase64(file);
        }
      } catch (readErr) {
        console.error('Read error:', readErr);
      }

      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();

      initialItems.push({
        id,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileBase64: base64 || undefined,
        textContent: text || undefined,
        status: 'queued',
        studentName: cleanName,
        totalScore: 0,
        maxScore: assignmentSettings.maxScore,
        tasks: [],
        classroomComment: '',
      });
    }

    setSubmissions((prev) => [...initialItems, ...prev]);

    for (let i = 0; i < initialItems.length; i++) {
      const currentItem = initialItems[i];

      setSubmissions((prev) =>
        prev.map((s) => (s.id === currentItem.id ? { ...s, status: 'analyzing' } : s))
      );

      const completedItem = await analyzeSingleItem(currentItem);

      setSubmissions((prev) =>
        prev.map((s) => (s.id === completedItem.id ? completedItem : s))
      );

      setProcessedCount(i + 1);
    }

    setIsProcessing(false);
  };

  // Handle loading sample submissions
  const handleLoadSamples = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalQueueCount(SAMPLE_WORKSHEETS.length);

    const sampleItems: StudentSubmission[] = SAMPLE_WORKSHEETS.map((sample, idx) => {
      const cleanName = sample.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/(10[А-Я]|Работен|Лист|Лабораторен|Протокол|ИТ|Мрежи|Проверка)/gi, '')
        .trim();

      return {
        id: `sample-${Date.now()}-${idx}`,
        fileName: sample.fileName,
        fileType: sample.fileType,
        fileSize: sample.textContent.length,
        textContent: sample.textContent,
        status: 'queued',
        studentName: cleanName || sample.fileName,
        totalScore: 0,
        maxScore: assignmentSettings.maxScore,
        tasks: [],
        classroomComment: '',
      };
    });

    setSubmissions((prev) => [...sampleItems, ...prev]);

    for (let i = 0; i < sampleItems.length; i++) {
      const currentItem = sampleItems[i];

      setSubmissions((prev) =>
        prev.map((s) => (s.id === currentItem.id ? { ...s, status: 'analyzing' } : s))
      );

      const completedItem = await analyzeSingleItem(currentItem);

      setSubmissions((prev) =>
        prev.map((s) => (s.id === completedItem.id ? completedItem : s))
      );

      setProcessedCount(i + 1);
    }

    setIsProcessing(false);
  };

  const handleRetryItem = async (item: StudentSubmission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: 'analyzing', errorMessage: undefined } : s))
    );
    const updated = await analyzeSingleItem(item);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleInspect = (sub: StudentSubmission) => {
    setInspectSubmission(sub);
    setIsDetailOpen(true);
  };

  const handleSaveSubmission = (updated: StudentSubmission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleDelete = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteMultiple = (ids: string[]) => {
    setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)));
  };

  const handleClearAll = () => {
    setSubmissions([]);
  };

  const handleExport = () => {
    exportToCSV(submissions, assignmentSettings.topicTitle, assignmentSettings.maxScore);
  };

  const handleSaveSettings = (newSettings: AssignmentSettings, regradeExisting: boolean) => {
    setAssignmentSettings(newSettings);
    if (regradeExisting) {
      regradeAllSubmissions(newSettings);
    }
  };

  const scrollToUpload = () => {
    document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <TopNav
        onLoadSamples={handleLoadSamples}
        onOpenRubric={() => setIsRubricOpen(true)}
        onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExport={handleExport}
        activeTopicTitle={assignmentSettings.topicTitle}
        activeMaxScore={assignmentSettings.maxScore}
        hasSubmissions={submissions.length > 0}
        totalSubmissions={submissions.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroBanner
          topicTitle={assignmentSettings.topicTitle}
          maxScore={assignmentSettings.maxScore}
          onScrollToUpload={scrollToUpload}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <UploadZone
          onFilesSelected={handleFilesSelected}
          onLoadSamples={handleLoadSamples}
          onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
          isProcessing={isProcessing}
          activeCount={processedCount}
          totalCount={totalQueueCount}
        />

        <ResultsTable
          submissions={submissions}
          topicTitle={assignmentSettings.topicTitle}
          maxScore={assignmentSettings.maxScore}
          onInspect={handleInspect}
          onDelete={handleDelete}
          onDeleteMultiple={handleDeleteMultiple}
          onClearAll={handleClearAll}
          onExport={handleExport}
          onRetry={handleRetryItem}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRegradeAll={submissions.length > 0 ? () => regradeAllSubmissions() : undefined}
          onLoadSamples={handleLoadSamples}
        />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            AutoGrade IT · Универсален асистент за автоматична проверка по всякакви теми
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
            >
              Настройки на рубриката ({assignmentSettings.maxScore} т.)
            </button>
            <span>·</span>
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center gap-1"
            >
              Google Drive импорт
            </button>
            <span>·</span>
            <span>Поддържа .pdf, .docx, .txt, .png, .jpg</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AssignmentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={assignmentSettings}
        onSave={handleSaveSettings}
        hasExistingSubmissions={submissions.length > 0}
      />

      <RubricInfoModal
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
        settings={assignmentSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onFilesImported={handleFilesSelected}
      />

      <StudentDetailModal
        submission={inspectSubmission}
        topicTitle={assignmentSettings.topicTitle}
        maxScore={assignmentSettings.maxScore}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSave={handleSaveSubmission}
      />
    </div>
  );
}
