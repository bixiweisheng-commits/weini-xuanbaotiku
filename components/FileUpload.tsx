import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (validTypes.includes(file.type) || file.name.endsWith('.docx')) {
      onFileSelect(file);
    } else {
      alert('文件格式无效。请上传 PDF 或 DOCX 文件。');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out cursor-pointer
        ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 bg-white'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx"
          onChange={(e) => e.target.files && validateAndUpload(e.target.files[0])}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-xl font-semibold text-gray-700">正在分析文档...</p>
                <p className="text-sm text-gray-500 mt-2">正在生成 25 道智能考题，这可能需要一分钟。</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <UploadCloud className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                上传学习资料
              </h3>
              <p className="text-gray-500 max-w-sm">
                将您的 <strong>PDF</strong> 或 <strong>DOCX</strong> 文件拖放到此处，或点击浏览。
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                 <FileText className="w-3 h-3" />
                 <span>最大文件大小: 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-pulse">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;