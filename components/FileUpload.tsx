import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { COLORS } from '../constants';

interface Props {
  onDataLoaded: (csvText: string) => void;
}

const FileUpload: React.FC<Props> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    
    // Recursive function to try encodings
    const readWithEncoding = (encoding: string) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        
        // Heuristic 1: Check for valid Russian or English headers
        const commonHeaders = [
          'День', 'Сотрудник', 'Проект', 'Тип', 'Часов', // Russian
          'Date', 'Employee', 'Project', 'Type', 'Hours'  // English
        ];
        
        const hasValidHeader = commonHeaders.some(h => text.includes(h));

        // Heuristic 2: Check for replacement character  (U+FFFD)
        // This usually appears when reading Windows-1251 as UTF-8
        const hasReplacementChars = text.includes('\uFFFD');

        if ((!hasValidHeader || hasReplacementChars) && encoding === 'UTF-8') {
          console.log('UTF-8 parsing seemed to fail (no keywords or found replacement chars), retrying with Windows-1251');
          readWithEncoding('windows-1251');
          return;
        }

        if (hasValidHeader || encoding === 'windows-1251') {
           onDataLoaded(text);
        } else {
           // Fallback: just load it anyway if both fail
           onDataLoaded(text);
        }
      };
      
      reader.onerror = () => {
        setError("Ошибка при чтении файла");
      };

      reader.readAsText(file, encoding);
    };

    // Start with UTF-8
    readWithEncoding('UTF-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer group
          ${dragActive 
            ? 'border-[#B5F836] bg-[#B5F836]/10 scale-[1.02]' 
            : 'border-gray-600 bg-[#193133]/50 hover:border-[#B5F836] hover:bg-[#193133]'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".csv" 
          className="hidden" 
        />
        
        <div className={`
          p-5 rounded-full mb-6 transition-transform duration-300 shadow-2xl
          ${dragActive ? 'bg-[#B5F836] scale-110' : 'bg-[#003B46] group-hover:scale-110 group-hover:bg-[#004d5b]'}
        `}>
          <Upload className={`w-10 h-10 ${dragActive ? 'text-[#193133]' : 'text-[#B5F836]'}`} />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 font-comfortaa">
          Загрузить CSV отчет
        </h3>
        
        <p className="text-gray-400 text-center max-w-md mb-6 leading-relaxed">
          Перетащите файл сюда или нажмите для выбора.<br/>
          <span className="text-sm opacity-60 mt-2 block">
            Поддерживает кодировки UTF-8 и Windows-1251
          </span>
        </p>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-black/20 px-4 py-2 rounded-full">
          <FileText className="w-4 h-4" />
          <span>Формат: День, Проект, Тип активности...</span>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;