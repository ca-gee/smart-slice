import React from 'react';
import { Button } from './ui/button';
import { Table, LayoutGrid, BarChart2, Settings, History, HelpCircle } from 'lucide-react';

interface SidebarProps {
  activeView: 'table' | 'grid' | 'chart';
  onViewChange: (view: 'table' | 'grid' | 'chart') => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  onHelpClick: () => void;
  isCollapsed: boolean;
}

export function Sidebar({
  activeView,
  onViewChange,
  onSettingsClick,
  onHistoryClick,
  onHelpClick,
  isCollapsed,
}: SidebarProps) {
  return (
    <div className={`h-full flex flex-col bg-background/50 border-r transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-48'}`}>
      <div className="flex-none p-2">
        <div className="space-y-2">
          <Button
            variant={activeView === 'table' ? 'default' : 'ghost'}
            className={`w-full ${isCollapsed ? 'h-8 px-0 justify-center' : 'justify-start'} transition-colors`}
            onClick={() => onViewChange('table')}
          >
            <Table className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">表格视图</span>}
          </Button>
          <Button
            variant={activeView === 'grid' ? 'default' : 'ghost'}
            className={`w-full ${isCollapsed ? 'h-8 px-0 justify-center' : 'justify-start'} transition-colors`}
            onClick={() => onViewChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">网格视图</span>}
          </Button>
          <Button
            variant={activeView === 'chart' ? 'default' : 'ghost'}
            className={`w-full ${isCollapsed ? 'h-8 px-0 justify-center' : 'justify-start'} transition-colors`}
            onClick={() => onViewChange('chart')}
          >
            <BarChart2 className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">图表视图</span>}
          </Button>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex-none p-2 border-t border-border/50">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? 'h-8 px-0 justify-center' : 'justify-start'} transition-colors hover:bg-muted/50`}
            onClick={onSettingsClick}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">设置</span>}
          </Button>
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? 'h-8 px-0 justify-center' : 'justify-start'} transition-colors hover:bg-muted/50`}
            onClick={onHistoryClick}
          >
            <History className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">历史记录</span>}
          </Button>
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? 'h-8 px-0 justify-center' : 'justify-start'} transition-colors hover:bg-muted/50`}
            onClick={onHelpClick}
          >
            <HelpCircle className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">帮助</span>}
          </Button>
        </div>
      </div>
    </div>
  );
} 