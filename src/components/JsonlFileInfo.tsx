import React from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface JsonlFileInfoProps {
  filename: string;
  totalLines: number;
  onClose: () => void;
}

export function JsonlFileInfo({
  filename,
  totalLines,
  onClose,
}: JsonlFileInfoProps) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <h2 className="text-lg font-semibold">{filename}</h2>
        <p className="text-sm text-muted-foreground">
          {totalLines.toLocaleString()} 行
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 