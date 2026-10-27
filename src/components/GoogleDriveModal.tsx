import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileCode,
  DownloadCloud,
  LogOut,
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  FolderCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  listDriveFolderContents,
  fetchAllFilesInsideFolder,
  downloadDriveFile,
  DriveFileItem,
  getAccessToken,
} from '../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesImported: (files: File[]) => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onFilesImported,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Folder navigation state
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Моят диск' },
  ]);
  const [items, setItems] = useState<DriveFileItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const currentFolder = folderPath[folderPath.length - 1];

  // On open, check if we already have an active token
  useEffect(() => {
    if (isOpen) {
      const activeToken = getAccessToken();
      if (activeToken) {
        setToken(activeToken);
        loadFolder(activeToken, currentFolder.id, searchQuery, mimeFilter);
      }
    }
  }, [isOpen]);

  const loadFolder = async (
    authToken: string,
    folderId = 'root',
    query = '',
    filter = 'all'
  ) => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const driveItems = await listDriveFolderContents(authToken, folderId, query, filter);
      setItems(driveItems);
      // Clear selection when navigating to a new folder unless searching
      if (!query) {
        setSelectedIds(new Set());
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Неуспешно зареждане на файловете от Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadFolder(result.accessToken, 'root', searchQuery, mimeFilter);
      }
    } catch (err: any) {
      setError(err.message || 'Грешка при вход с Google профил.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setItems([]);
    setSelectedIds(new Set());
    setFolderPath([{ id: 'root', name: 'Моят диск' }]);
  };

  const handleNavigateToFolder = (folder: DriveFileItem) => {
    if (!token) return;
    const newPath = [...folderPath, { id: folder.id, name: folder.name }];
    setFolderPath(newPath);
    setSearchQuery('');
    loadFolder(token, folder.id, '', mimeFilter);
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    if (!token) return;
    const targetItem = folderPath[index];
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setSearchQuery('');
    loadFolder(token, targetItem.id, '', mimeFilter);
  };

  const handleNavigateUp = () => {
    if (folderPath.length > 1) {
      handleNavigateToBreadcrumb(folderPath.length - 2);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      loadFolder(token, currentFolder.id, searchQuery, mimeFilter);
    }
  };

  const handleFilterChange = (filter: string) => {
    setMimeFilter(filter);
    if (token) {
      loadFolder(token, currentFolder.id, searchQuery, filter);
    }
  };

  const fileItems = items.filter((item) => !item.isFolder);
  const folderItems = items.filter((item) => item.isFolder);

  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllInCurrentFolder = () => {
    if (selectedIds.size === fileItems.length && fileItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fileItems.map((f) => f.id)));
    }
  };

  // Import all files inside a specific folder directly with 1 click
  const handleImportEntireFolder = async (folder: DriveFileItem) => {
    if (!token) return;
    setIsDownloading(true);
    setError(null);

    try {
      const folderFiles = await fetchAllFilesInsideFolder(token, folder.id);

      if (folderFiles.length === 0) {
        setError(`Папката "${folder.name}" не съдържа поддържани файлове (.pdf, .docx, .txt, Google Документи, снимки).`);
        setIsDownloading(false);
        return;
      }

      setDownloadProgress({ current: 0, total: folderFiles.length });
      const downloadedFiles: File[] = [];

      for (let i = 0; i < folderFiles.length; i++) {
        try {
          const fileObj = await downloadDriveFile(token, folderFiles[i]);
          downloadedFiles.push(fileObj);
        } catch (dlErr) {
          console.error('Error downloading:', folderFiles[i].name, dlErr);
        }
        setDownloadProgress({ current: i + 1, total: folderFiles.length });
      }

      setIsDownloading(false);

      if (downloadedFiles.length > 0) {
        onFilesImported(downloadedFiles);
        onClose();
      } else {
        setError('Не бе възможно да се изтеглят файловете от папката.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Грешка при сваляне на съдържанието на папката.');
      setIsDownloading(false);
    }
  };

  const handleImportSelected = async () => {
    if (!token || selectedIds.size === 0) return;

    const selectedFiles = fileItems.filter((f) => selectedIds.has(f.id));
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: selectedFiles.length });

    const downloadedFiles: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const fileObj = await downloadDriveFile(token, selectedFiles[i]);
        downloadedFiles.push(fileObj);
      } catch (dlErr: any) {
        console.error('Download error for file:', selectedFiles[i].name, dlErr);
      }
      setDownloadProgress({ current: i + 1, total: selectedFiles.length });
    }

    setIsDownloading(false);

    if (downloadedFiles.length > 0) {
      onFilesImported(downloadedFiles);
      onClose();
    } else {
      setError('Не бе възможно да се изтеглят избраните файлове.');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
      return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
    }
    if (mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="w-5 h-5 text-indigo-600 shrink-0" />;
    }
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    return <FileCode className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const num = Number(bytes);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Google Drive · Преглед на папки и файлове
              </h2>
              <p className="text-xs text-slate-500">
                Отворете папка на клас или изберете всички ученически листи наведнъж
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

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {!token ? (
            /* Login view */
            <div className="py-14 px-4 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Свързване с Google Drive
              </h3>
              <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                Влезте с Вашия Google акаунт, за да навигирате по папките на Вашите класове и да изберете цяла папка с предадени работни листи с един клик.
              </p>

              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium text-sm shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-60"
              >
                {isSigningIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isSigningIn ? 'Свързване...' : 'Вход с Google'}</span>
              </button>

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* Folder Explorer view */
            <div className="space-y-4">
              {/* Top Bar: Search and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Търсене в папките и файловете..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        if (token) loadFolder(token, currentFolder.id, '', mimeFilter);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => token && loadFolder(token, currentFolder.id, searchQuery, mimeFilter)}
                    disabled={isLoadingFiles}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    title="Опресни"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Изход
                  </button>
                </div>
              </div>

              {/* Breadcrumb Navigation Bar */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {folderPath.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNavigateUp}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium text-xs transition-colors shrink-0"
                      title="Едно ниво нагоре"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                      Назад
                    </button>
                  )}

                  {folderPath.map((item, index) => {
                    const isLast = index === folderPath.length - 1;
                    return (
                      <React.Fragment key={item.id}>
                        {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <button
                          type="button"
                          onClick={() => handleNavigateToBreadcrumb(index)}
                          className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            isLast
                              ? 'bg-white font-bold text-slate-900 shadow-sm border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          {index === 0 ? '📁 ' + item.name : item.name}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Quick Button to select all files in current folder */}
                {fileItems.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllInCurrentFolder}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded-md transition-colors text-xs"
                  >
                    {selectedIds.size === fileItems.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Отмаркирай всички</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-blue-600" />
                        <span>Избери всички файлове ({fileItems.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Main Content Area: Folders + Files */}
              {isLoadingFiles ? (
                <div className="py-20 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                  <span className="text-xs">Зареждане на папките и файловете...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FolderOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Тази папка е празна</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Няма намерени подпапки или ученически файлове (.pdf, .docx, .txt, снимки).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* FOLDERS SECTION */}
                  {folderItems.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Folder className="w-4 h-4 text-amber-500" />
                        <span>Папки ({folderItems.length})</span>
                        <span className="text-slate-400 font-normal lowercase">· кликнете за отваряне</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {folderItems.map((folder) => (
                          <div
                            key={folder.id}
                            className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-300 transition-all text-left"
                          >
                            <button
                              type="button"
                              onClick={() => handleNavigateToFolder(folder)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <Folder className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-xs text-slate-900 truncate group-hover:text-blue-700">
                                  {folder.name}
                                </div>
                                <div className="text-[10px] text-slate-400">Папка</div>
                              </div>
                            </button>

                            {/* 1-click import all files in this folder */}
                            <button
                              type="button"
                              onClick={() => handleImportEntireFolder(folder)}
                              disabled={isDownloading}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-200 shrink-0 ml-1.5"
                              title={`Импортирай всички файлове от папка "${folder.name}"`}
                            >
                              <FolderCheck className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FILES SECTION */}
                  <div>
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span>Работни листи в тази папка ({fileItems.length})</span>
                      </div>
                      {fileItems.length > 0 && (
                        <span className="text-slate-500 text-[11px] normal-case font-normal">
                          Избрани: <strong className="text-slate-900 font-mono">{selectedIds.size}</strong> от {fileItems.length}
                        </span>
                      )}
                    </div>

                    {fileItems.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                        Няма файлове директно в тази папка. Отворете някоя от папките по-горе.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto bg-white">
                        {fileItems.map((file) => {
                          const isSelected = selectedIds.has(file.id);
                          return (
                            <div
                              key={file.id}
                              onClick={() => toggleSelectFile(file.id)}
                              className={`flex items-center gap-3 p-3 text-xs transition-colors cursor-pointer select-none ${
                                isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by parent container
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                              />
                              {getFileIcon(file.mimeType)}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900 truncate">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  {file.size && <span>{formatFileSize(file.size)}</span>}
                                  {file.size && <span aria-hidden="true">·</span>}
                                  <span>
                                    {file.modifiedTime
                                      ? new Date(file.modifiedTime).toLocaleDateString('bg-BG')
                                      : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Download progress bar */}
              {isDownloading && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center justify-between font-medium text-blue-950 mb-1.5">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      Сваляне на файлове от Drive...
                    </span>
                    <span className="font-mono tabular-nums">
                      {downloadProgress.current} от {downloadProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                      style={{
                        width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Затвори
          </button>

          {token && fileItems.length > 0 && (
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedIds.size === 0 || isDownloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Импортиране...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Импортирай избраните ({selectedIds.size})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
