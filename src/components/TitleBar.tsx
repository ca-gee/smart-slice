import React from 'react';
import { Button } from './ui/button';
import { Moon, Sun, Bug, FileOutput } from 'lucide-react';
import { Window } from '@tauri-apps/api/window';

interface TitleBarProps {
  darkMode: boolean;
  isDebugMode: boolean;
  onToggleDarkMode: () => void;
  onToggleDebugMode: () => void;
  onGenerateTestFile: () => void;
}

export function TitleBar({
  darkMode,
  isDebugMode,
  onToggleDarkMode,
  onToggleDebugMode,
  onGenerateTestFile,
}: TitleBarProps) {
  const window = Window.getCurrent();
  const isMacOS = navigator.platform.includes('Mac');

  return (
    <div 
      data-tauri-drag-region 
      className="fixed top-0 left-0 right-0 flex items-center justify-between h-12 px-4 bg-background"
    >
      {/* macOS 窗口控制按钮 */}
      {isMacOS && (
        <div className="flex items-center space-x-2 mr-4">
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

      {/* 左侧标题 */}
      <div className="flex items-center">
        <h1 className="text-lg font-bold">JSONL 文件查看器</h1>
      </div>

      {/* 右侧按钮组 */}
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

        {/* Windows/Linux 窗口控制按钮 */}
        {!isMacOS && (
          <div className="flex items-center space-x-2 ml-4">
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
    </div>
  );
} 