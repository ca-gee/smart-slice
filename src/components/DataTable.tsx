import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface DataTableProps {
  data: Record<string, any>[];
}

export function DataTable({ data }: DataTableProps) {
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 从所有数据中提取唯一的字段名作为表头
  const headers = useMemo(() => {
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    // 优先显示常见重要字段
    const priorityKeys = ['id', 'name', 'title', 'date', 'type', 'status'];
    
    // 排序后的键名
    return [...allKeys].sort((a, b) => {
      const indexA = priorityKeys.indexOf(a);
      const indexB = priorityKeys.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  const handleViewDetails = (row: Record<string, any>) => {
    setSelectedRow(row);
    setIsDialogOpen(true);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return '...';
    if (typeof value === 'boolean') return value ? '是' : '否';
    return String(value);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                  {headers.map(header => (
                    <TableCell key={header}>{formatValue(row[header])}</TableCell>
                  ))}
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewDetails(row)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>详细信息</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {selectedRow ? JSON.stringify(selectedRow, null, 2) : ''}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 