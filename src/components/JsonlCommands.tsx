import React from 'react';
import { Button } from './ui/button';
import { Download, FileOutput } from 'lucide-react';

interface JsonlCommandsProps {
  onExport: () => void;
  onGenerate: () => void;
}

export function JsonlCommands({ onExport, onGenerate }: JsonlCommandsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        导出
      </Button>
      <Button variant="outline" onClick={onGenerate}>
        <FileOutput className="mr-2 h-4 w-4" />
        生成测试文件
      </Button>
    </div>
  );
} 