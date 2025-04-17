import React from 'react';
import { Button } from './ui/button';
import { Moon, Sun, Bug, FileOutput, ChevronLeft, ChevronRight } from 'lucide-react';
import { Window } from '@tauri-apps/api/window';

interface TitleBarProps {
  darkMode: boolean;
  isDebugMode: boolean;
  onToggleDarkMode: () => void;
  onToggleDebugMode: () => void;
  onGenerateTestFile: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function TitleBar({
  darkMode,
  isDebugMode,
  onToggleDarkMode,
  onToggleDebugMode,
  onGenerateTestFile,
  isSidebarCollapsed,
  onToggleSidebar,
}: TitleBarProps) {
  const window = Window.getCurrent();
  const isMacOS = navigator.platform.includes('Mac');

  return (
    <>
      <div 
        className="fixed top-0 left-0 right-0 flex flex-col bg-background"
      >
        {/* 窗口控制区域 */}
        <div 
          data-tauri-drag-region 
          className="flex items-center justify-between h-8 px-4 bg-background/80"
        >
          {/* macOS 窗口控制按钮 */}
          {isMacOS && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.close()}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.minimize()}
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.toggleMaximize()}
                className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600"
              />
            </div>
          )}

          {/* Windows/Linux 窗口控制按钮 */}
          {!isMacOS && (
            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.minimize()}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="text-lg">-</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.toggleMaximize()}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="text-lg">□</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.close()}
                className="hover:bg-red-500 hover:text-white"
              >
                <span className="text-lg">×</span>
              </Button>
            </div>
          )}
        </div>

        {/* 业务按钮区域 */}
        <div 
          data-tauri-drag-region 
          className="flex items-center justify-between h-12 px-4 bg-background"
        >
          {/* 左侧标题和折叠按钮 */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="hover:bg-muted/50"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            {!isSidebarCollapsed && <h2 className="text-lg font-semibold text-foreground">视图</h2>}
          </div>

          {/* 右侧业务按钮组 */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onToggleDebugMode}
              title={isDebugMode ? "退出调试模式" : "启用调试数据"}
              className={isDebugMode ? "bg-yellow-100 dark:bg-yellow-900" : ""}
            >
              <Bug className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onGenerateTestFile}
              title="生成测试文件"
            >
              <FileOutput className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onToggleDarkMode}
              title={darkMode ? "切换到亮色模式" : "切换到暗色模式"}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* 内容区域占位符 */}
      <div className="h-12" />
    </>
  );
} 