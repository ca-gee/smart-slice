import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { JsonlTable } from './JsonlTable';
import { JsonlPagination } from './JsonlPagination';
import { JsonlSearch } from './JsonlSearch';
import { JsonlStats } from './JsonlStats';
import { JsonlFileInfo } from './JsonlFileInfo';
import { JsonlCommands } from './JsonlCommands';
import { JsonlData } from '@/types/jsonl';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface JsonlViewerProps {
  data: JsonlData;
  activeView: 'table' | 'grid' | 'chart';
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onClose: () => void;
  onExport: () => void;
  onGenerate: () => void;
}

export function JsonlViewer({
  data,
  activeView,
  onPageChange,
  onSearch,
  onClose,
  onExport,
  onGenerate
}: JsonlViewerProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    if (data.rows.length > 0) {
      const firstRow = data.rows[0];
      setColumns(Object.keys(firstRow));
    }
  }, [data.rows]);

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 - 固定高度 */}
      <div className="flex-none flex flex-col space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <JsonlSearch onSearch={onSearch} />
          </div>
          <div className="flex items-center gap-4">
            <JsonlFileInfo 
              filename={data.filename} 
              totalLines={data.totalLines} 
              onClose={onClose} 
            />
          </div>
        </div>
      </div>

      {/* 数据展示区域 - 自适应高度 */}
      <div className="flex-1 min-h-0 p-4">
        <Card className="h-full">
          {activeView === 'table' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto">
                <div className="min-w-full">
                  <Table>
                    <TableHeader>
                      {columns.map((column: string) => (
                        <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {data.rows.map((row, index) => (
                        <TableRow key={index}>
                          {columns.map((column: string) => (
                            <TableCell key={column} className="whitespace-nowrap">{JSON.stringify(row[column])}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          {activeView === 'grid' && (
            <div className="h-full flex flex-col">
              <div className="flex-none p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">网格视图</h3>
                  <div className="text-sm text-muted-foreground">
                    共 {data.rows.length} 条数据
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.rows.map((row, index) => (
                    <Card key={index} className="p-4">
                      <pre className="text-sm overflow-auto">{JSON.stringify(row, null, 2)}</pre>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeView === 'chart' && (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">图表视图（待实现）</p>
            </div>
          )}
        </Card>
      </div>

      {/* 分页控制 - 固定高度 */}
      <div className="flex-none flex justify-center p-4">
        <JsonlPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
} 