import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationBarProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  const handlePrevClick = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      // 重置为当前页
      setPageInput(currentPage.toString());
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevClick}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextClick}
          disabled={currentPage >= totalPages}
        >
          下一页
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <form onSubmit={handlePageSubmit} className="flex items-center space-x-2">
          <Input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 h-8 text-center"
          />
          <span className="text-sm text-muted-foreground">/ {totalPages}</span>
          <Button type="submit" variant="outline" size="sm">
            跳转
          </Button>
        </form>
      </div>
      
      <div className="text-sm text-muted-foreground">
        当前页 {currentPage} / 共 {totalPages} 页
      </div>
    </div>
  );
} 