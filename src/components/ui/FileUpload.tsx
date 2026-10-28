'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  helperText?: string;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.csv, text/csv',
  maxSizeMb = 10,
  label = 'Upload POS Inventory File',
  helperText = 'Drag and drop Gayoo POS CSV export or click to browse',
  onFileSelect,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = (file: File) => {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMb} MB limit.`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-bold text-slate-700 tracking-wide">{label}</label>}

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none
          ${
            disabled
              ? 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed'
              : isDragging
              ? 'border-[#76CA3E] bg-[#F1F9EC]'
              : 'border-slate-300 bg-white hover:border-[#76CA3E] hover:bg-[#F8FAF7]'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndPass(e.target.files[0]);
            }
          }}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3 w-full bg-[#F1F9EC] border border-[#76CA3E]/30 p-3 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#76CA3E]/20 text-[#143B0D] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to sync</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-[#143B0D]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-[#143B0D] underline decoration-[#76CA3E] underline-offset-2">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
