import React from 'react';
import { JsonObject } from '@/types/jsonl';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface JsonlTableProps {
  data: JsonObject[];
}

export function JsonlTable({ data }: JsonlTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="whitespace-nowrap w-48 bg-background">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="truncate max-w-[180px]">
                      {header}
                    </TooltipTrigger>
                    <TooltipContent>
                      {header}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {headers.map((header) => (
                <TableCell key={header} className="whitespace-nowrap w-48">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="truncate max-w-[180px]">
                        {JSON.stringify(row[header])}
                      </TooltipTrigger>
                      <TooltipContent>
                        {JSON.stringify(row[header])}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 