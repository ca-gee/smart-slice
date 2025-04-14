import React from 'react';
import { JsonlStats as JsonlStatsType } from '@/types/jsonl';

interface JsonlStatsProps extends JsonlStatsType {}

export function JsonlStats({
  totalLines,
  currentPage,
  totalPages,
}: JsonlStatsProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div>总行数: {totalLines.toLocaleString()}</div>
      <div>当前页: {currentPage}</div>
      <div>总页数: {totalPages}</div>
    </div>
  );
} 