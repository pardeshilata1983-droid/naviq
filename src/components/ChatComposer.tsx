import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowUp,
  Paperclip,
  Sparkles,
  Loader2,
  StopCircle,
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  FileArchive,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Database,
  UploadCloud,
  Layers,
  Cpu,
} from 'lucide-react';
import { glass } from '../lib/styles';
import { UploadedDataset } from '../types';

export type UploadProcessingStage = 'idle' | 'uploading' | 'extracting' | 'indexing' | 'ready';

interface ChatComposerProps {
  id?: string;
  placeholder?: string;
  onSubmit: (message: string, file?: File | null) => Promise<void> | void;
  isLoading?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
  size?: 'normal' | 'large';
  suggestedPrompts?: string[];
  onSelectPrompt?: (prompt: string) => void;
  showSuggestions?: boolean;
  className?: string;
  activeDataset?: UploadedDataset | null;
  onClearDataset?: () => void;
  uploadStage?: UploadProcessingStage;
  uploadProgress?: number;
}

const SUPPORTED_EXTENSIONS = ['.zip', '.csv', '.xlsx', '.xls', '.pdf', '.docx', '.json', '.txt', '.md'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const ChatComposer: React.FC<ChatComposerProps> = ({
  id = 'naviq-chat-composer',
  placeholder = 'Ask Naviq anything...',
  onSubmit,
  isLoading = false,
  onCancel,
  autoFocus = false,
  size = 'normal',
  suggestedPrompts = [],
  onSelectPrompt,
  showSuggestions = false,
  className = '',
  activeDataset = null,
  onClearDataset,
  uploadStage = 'idle',
  uploadProgress = 0,
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(newHeight, size === 'large' ? 48 : 40)}px`;
  }, [input, size]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIconAndStyle = (fileName: string) => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (ext === '.zip') {
      return {
        icon: <FileArchive className="w-4 h-4 text-purple-400" />,
        badge: 'ZIP ARCHIVE',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    }
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      return {
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        badge: ext === '.csv' ? 'CSV DATA' : 'EXCEL SPREADSHEET',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    if (ext === '.pdf') {
      return {
        icon: <FileText className="w-4 h-4 text-rose-400" />,
        badge: 'PDF DOCUMENT',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    }
    if (ext === '.md' || ext === '.txt') {
      return {
        icon: <FileCode className="w-4 h-4 text-sky-400" />,
        badge: ext === '.md' ? 'MARKDOWN' : 'TEXT DOC',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    if (ext === '.json') {
      return {
        icon: <FileJson className="w-4 h-4 text-amber-400" />,
        badge: 'JSON DATA',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    return {
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      badge: 'DOCX',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
  };

  const validateFile = (file: File): boolean => {
    setValidationError(null);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setValidationError(`Unsupported file type (${ext}). Supported formats: ZIP, CSV, XLSX, PDF, MD.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File exceeds maximum size of 50MB (${formatFileSize(file.size)}).`);
      return false;
    }
    return true;
  };

  const handleSelectFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setShowUploadZone(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading || isProcessingFile) {
      return;
    }

    const msg = input.trim();
    const fileToSubmit = selectedFile;

    setInput('');
    setSelectedFile(null);
    setValidationError(null);
    setShowUploadZone(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSubmit(msg, fileToSubmit);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const fileConfig = useMemo(() => {
    return selectedFile ? getFileIconAndStyle(selectedFile.name) : null;
  }, [selectedFile]);

  const isProcessingFile = uploadStage === 'uploading' || uploadStage === 'extracting' || uploadStage === 'indexing';

  return (
    <div
      id={id}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full flex flex-col gap-2.5 relative ${className}`}
    >
      {/* Drag & Drop Full Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-emerald-950/95 border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-6 backdrop-blur-md transition-all animate-in fade-in duration-150 shadow-2xl">
          <UploadCloud className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-emerald-200">Drop your company dataset here</p>
          <p className="text-xs text-emerald-400/80 mt-1">Supports ZIP, CSV, XLSX, PDF, and MD (up to 50MB)</p>
        </div>
      )}

      {/* Optional Suggestion Chips */}
      {showSuggestions && suggestedPrompts.length > 0 && !selectedFile && !activeDataset && !showUploadZone && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              id={`suggested-prompt-${idx}`}
              type="button"
              onClick={() => (onSelectPrompt ? onSelectPrompt(prompt) : onSubmit(prompt))}
              disabled={isLoading || isProcessingFile}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-emerald-500/15 text-gray-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-all text-left flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-950/60 border border-red-500/30 rounded-xl text-xs text-red-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-red-400 hover:text-white p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Indexed Dataset Badge */}
      {activeDataset && !selectedFile && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/70 to-emerald-900/40 border border-emerald-500/30 rounded-xl shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-200 truncate">{activeDataset.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  ACTIVE DATASET
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/80">
                {activeDataset.files?.length || 0} file(s) indexed · {activeDataset.totalRecords || 0} records active in Naviq memory
              </span>
            </div>
          </div>
          {onClearDataset && (
            <button
              type="button"
              onClick={onClearDataset}
              title="Detach dataset"
              className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Detach</span>
            </button>
          )}
        </div>
      )}

      {/* Dedicated Interactive File Upload Drop Zone */}
      {showUploadZone && !selectedFile && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 bg-emerald-950/20 hover:bg-emerald-950/40 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 relative group"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowUploadZone(false);
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-200">
              Click to select or drag & drop company files
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Supports <strong className="text-emerald-300">ZIP</strong>, <strong className="text-emerald-300">CSV</strong>, <strong className="text-emerald-300">XLSX</strong>, <strong className="text-emerald-300">PDF</strong>, and <strong className="text-emerald-300">MD</strong> files (max 50MB)
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 font-mono">
              ZIP ARCHIVES
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-mono">
              CSV / XLSX
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20 font-mono">
              PDF BRIEFS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/20 font-mono">
              MD NOTES
            </span>
          </div>
        </div>
      )}

      {/* Selected File Preview & Real Multi-Stage Progress Indicator */}
      {selectedFile && fileConfig && (
        <div className="flex flex-col gap-2.5 p-3 bg-gray-900/90 border border-emerald-500/30 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {fileConfig.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-gray-200 truncate max-w-[200px] sm:max-w-[320px]">
                    {selectedFile.name}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${fileConfig.badgeColor}`}>
                    {fileConfig.badge}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>

            {/* Stage Indicator / Cancel Button */}
            {!isProcessingFile ? (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                title="Remove file"
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="capitalize">{uploadStage}...</span>
              </div>
            )}
          </div>

          {/* Real Processing Progress Stages (Upload, Extraction, Indexing) */}
          {isProcessingFile && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              {/* Three-Stage Breadcrumb */}
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {/* 1. Upload */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                    uploadStage === 'uploading'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold'
                      : uploadStage === 'extracting' || uploadStage === 'indexing' || uploadStage === 'ready'
                      ? 'bg-white/5 border-white/5 text-emerald-400/70'
                      : 'bg-transparent border-transparent text-gray-500'
                  }`}
                >
                  {uploadStage === 'uploading' ? (
                    <UploadCloud className="w-3 h-3 text-emerald-400 animate-pulse" />
                  ) : uploadStage === 'extracting' || uploadStage === 'indexing' || uploadStage === 'ready' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-gray-600 inline-block" />
                  )}
                  <span className="truncate">1. Uploading</span>
                </div>

                {/* 2. Extraction */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                    uploadStage === 'extracting'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold'
                      : uploadStage === 'indexing'
                      ? 'bg-white/5 border-white/5 text-emerald-400/70'
                      : 'bg-transparent border-transparent text-gray-500'
                  }`}
                >
                  {uploadStage === 'extracting' ? (
                    <Layers className="w-3 h-3 text-emerald-400 animate-spin" />
                  ) : uploadStage === 'indexing' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-gray-600 inline-block" />
                  )}
                  <span className="truncate">2. Extraction</span>
                </div>

                {/* 3. Indexing */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                    uploadStage === 'indexing'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold'
                      : 'bg-transparent border-transparent text-gray-500'
                  }`}
                >
                  {uploadStage === 'indexing' ? (
                    <Cpu className="w-3 h-3 text-emerald-400 animate-pulse" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-gray-600 inline-block" />
                  )}
                  <span className="truncate">3. Indexing</span>
                </div>
              </div>

              {/* Progress Detail & Bar */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
                <span>
                  {uploadStage === 'uploading'
                    ? `Uploading file payload (${uploadProgress}%)...`
                    : uploadStage === 'extracting'
                    ? 'Decompressing archives & extracting raw records...'
                    : uploadStage === 'indexing'
                    ? 'Parsing schemas & indexing records into Naviq memory...'
                    : 'Dataset ready for reasoning'}
                </span>
                {uploadStage === 'uploading' && (
                  <span className="font-mono text-emerald-400 font-semibold">{uploadProgress}%</span>
                )}
              </div>

              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{
                    width:
                      uploadStage === 'uploading'
                        ? `${Math.max(uploadProgress, 10)}%`
                        : uploadStage === 'extracting'
                        ? '65%'
                        : uploadStage === 'indexing'
                        ? '90%'
                        : '100%',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Composer Box */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-end gap-2 p-2 rounded-2xl ${glass} border border-white/10 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-200 bg-gray-950/80`}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <textarea
            ref={textareaRef}
            id={`${id}-input`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFile
                ? 'Type instructions or hit Enter to analyze file...'
                : activeDataset
                ? `Ask Naviq about ${activeDataset.name}...`
                : placeholder
            }
            rows={1}
            disabled={isLoading || isProcessingFile}
            className={`w-full bg-transparent border-0 resize-none text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0 ${
              size === 'large' ? 'text-base py-2.5 px-3' : 'text-sm py-2 px-3'
            } leading-relaxed max-h-44 disabled:opacity-60`}
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".zip,.pdf,.csv,.xlsx,.xls,.docx,.txt,.json,.md"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 pb-1 pr-1">
          {/* Upload Zone / File Picker Toggle */}
          <button
            type="button"
            id={`${id}-upload-toggle-btn`}
            onClick={() => setShowUploadZone((prev) => !prev)}
            disabled={isLoading || isProcessingFile}
            title="Toggle company file upload zone (ZIP, CSV, XLSX, PDF, MD)"
            className={`p-2 rounded-xl transition-all ${
              showUploadZone
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
            } disabled:opacity-40`}
          >
            <UploadCloud className="w-4 h-4" />
          </button>

          <button
            type="button"
            id={`${id}-attach-btn`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingFile}
            title="Browse file to upload"
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {isLoading ? (
            <button
              type="button"
              id={`${id}-cancel-btn`}
              onClick={onCancel}
              title="Stop generating"
              className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 transition-all flex items-center justify-center"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              id={`${id}-submit-btn`}
              disabled={(!input.trim() && !selectedFile) || isProcessingFile}
              title="Send message"
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                (input.trim() || selectedFile) && !isProcessingFile
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                  : 'bg-white/[0.05] text-gray-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isProcessingFile ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          )}
        </div>
      </form>

      {/* Helper text */}
      <div className="flex items-center justify-between px-1 text-[10px] text-gray-500">
        <span>Supports ZIP, CSV, XLSX, PDF, MD (up to 50MB)</span>
        <span className="hidden sm:inline">Press Enter to send · Shift+Enter for new line</span>
      </div>
    </div>
  );
};
