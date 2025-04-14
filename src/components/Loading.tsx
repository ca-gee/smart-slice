import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';

interface LoadingProgress {
  current: number;
  total: number;
  stage: string;
  percentage: number;
}

interface LoadingProps {
  isLoading: boolean;
  loadingText: string;
  loadingProgress: LoadingProgress | null;
}

export function Loading({ isLoading, loadingText, loadingProgress }: LoadingProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium mb-3">{loadingText}</p>
        
        {loadingProgress && (
          <div className="w-full space-y-2">
            <Progress value={loadingProgress.percentage} className="w-full h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(loadingProgress.percentage)}%</span>
              <span>{loadingProgress.current.toLocaleString()} / {loadingProgress.total.toLocaleString()} 行</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 