import React from 'react';
import { FileText } from 'lucide-react';

interface FileUploadProps {
  onOpenFile: () => void;
}

export function FileUpload({ onOpenFile }: FileUploadProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div 
        onClick={onOpenFile}
        className="group relative w-full max-w-2xl p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
          <h2 className="text-2xl font-semibold mb-2">打开 JSONL 文件</h2>
          <p className="text-muted-foreground mb-4">点击或拖拽文件到此处</p>
        </div>
      </div>
    </div>
  );
} 