import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Progress } from './ui/progress';
import { FileText, RefreshCw, Database, Loader2, Bug, FileOutput, Settings, History, HelpCircle, LayoutGrid, BarChart2 } from 'lucide-react';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { JsonlViewer } from './JsonlViewer';

interface FileData {
  data: Record<string, any>[];
  total: number;
}

interface LoadingProgress {
  current: number;
  total: number;
  stage: string;
  percentage: number;
}

export function MainView() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(0);
  const [fileData, setFileData] = useState<FileData>({ data: [], total: 0 });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [lineCount, setLineCount] = useState(1000);
  const [loadingText, setLoadingText] = useState('加载中...');
  
  // 进度相关状态
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'grid' | 'chart'>('table');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 监听文件加载进度事件
  useEffect(() => {
    const unlisten = listen<LoadingProgress>('jsonl-loading-progress', (event) => {
      const progress = event.payload;
      setLoadingProgress(progress);
      setLoadingText(`${progress.stage}: ${progress.current.toLocaleString()} / ${progress.total.toLocaleString()} 行 (${progress.percentage.toFixed(1)}%)`);
    });

    return () => {
      unlisten.then(unlistenFn => unlistenFn());
    };
  }, []);

  // 加载页面数据
  const loadPageData = async (page: number) => {
    if (!filePath && !isDebugMode) {
      console.log("未加载数据：没有文件路径且不在调试模式");
      return;
    }
    
    setIsLoading(true);
    setLoadingText('加载数据中...');
    try {
      console.log(`开始加载数据: 页码=${page}, 页大小=${pageSize}, 调试模式=${isDebugMode}, 搜索关键词="${searchKeyword}"`);
      
      let result: FileData;

      if (isDebugMode) {
        // 使用调试数据
        console.log("使用调试数据");
        result = searchKeyword
          ? await invoke<FileData>('search_debug_page', {
              keyword: searchKeyword,
              page,
              pageSize
            })
          : await invoke<FileData>('load_debug_page', {
              page,
              pageSize
            });
      } else {
        // 使用真实 JSONL 文件
        console.log(`使用真实JSONL文件: ${filePath}`);
        result = searchKeyword 
          ? await invoke<FileData>('search_page', { 
              keyword: searchKeyword, 
              page, 
              pageSize 
            })
          : await invoke<FileData>('load_page', { 
              page, 
              pageSize 
            });
      }
      
      console.log(`数据加载成功: 总条数=${result.total}, 当前页数据条数=${result.data.length}`);
      setFileData(result);
      setTotalPages(Math.ceil(result.total / pageSize));
    } catch (error) {
      console.error('加载数据失败:', error);
      alert(`加载数据失败: ${error}`);
    } finally {
      setIsLoading(false);
      setLoadingProgress(null);
    }
  };

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理搜索
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // 搜索时重置页码
  };

  // 打开文件
  const handleOpenFile = async () => {
    // 如果在调试模式，退出调试模式
    if (isDebugMode) {
      setIsDebugMode(false);
      setFilePath(null);
      setFileData({ data: [], total: 0 });
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'JSONL Files',
          extensions: ['jsonl']
        }]
      });
      
      console.log("选择的文件路径:", selected);
      
      if (selected && typeof selected === 'string') {
        try {
          console.log("尝试设置JSONL文件:", selected);
          
          // 设置初始加载状态，启用进度条显示
          setIsLoading(true);
          setIsInitialLoading(true);
          setLoadingText('初始化文件分析...');
          setLoadingProgress({
            current: 0,
            total: 100,
            stage: '准备分析文件',
            percentage: 0
          });
          
          // 先调用后端设置文件
          const result = await invoke<boolean>('set_jsonl_file', { 
            path: selected 
          });
          
          console.log("设置JSONL文件结果:", result);
          
          if (result) {
            setFilePath(selected);
            setCurrentPage(1);
            setSearchKeyword('');
            console.log("文件设置成功，将加载数据");
          } else {
            console.error("设置文件失败，后端返回false");
            alert("无法打开文件");
          }
        } catch (error) {
          console.error("设置文件时出错:", error);
          alert(`打开文件失败: ${error}`);
        } finally {
          setIsInitialLoading(false);
          setIsLoading(false);
          setLoadingProgress(null);
        }
      }
    } catch (error) {
      console.error('打开文件对话框失败:', error);
    }
  };

  // 切换调试模式
  const toggleDebugMode = async () => {
    if (isDebugMode) {
      // 退出调试模式
      setIsDebugMode(false);
      setFilePath(null);
      setFileData({ data: [], total: 0 });
    } else {
      // 进入调试模式，加载调试数据
      setIsLoading(true);
      setLoadingText('初始化调试数据...');
      try {
        // 初始化调试数据，默认生成10000条
        await invoke('init_debug_data', { rows: 10000 });
        setIsDebugMode(true);
        setFilePath(null);
        setCurrentPage(1);
        setSearchKeyword('');
      } catch (error) {
        console.error('初始化调试数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 切换暗黑模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  // 生成测试 JSONL 文件
  const handleGenerateTestFile = async () => {
    setShowGenerateDialog(true);
  };

  // 实际生成文件的函数
  const generateFile = async () => {
    setShowGenerateDialog(false);
    try {
      // 打开保存对话框
      const savePath = await save({
        defaultPath: 'test-data.jsonl',
        filters: [{
          name: 'JSONL Files',
          extensions: ['jsonl']
        }]
      });
      
      if (!savePath) return; // 用户取消
      
      setIsLoading(true);
      setLoadingText('生成测试文件中...');
      
      try {
        // 生成用户指定行数的测试文件
        const result = await invoke<string>('generate_test_jsonl', {
          path: savePath,
          lines: lineCount
        });
        
        alert(result);
      } catch (error) {
        console.error('生成测试文件失败:', error);
        alert(`生成测试文件失败: ${error}`);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('保存对话框错误:', error);
    }
  };

  // 页面或搜索关键词变化时加载数据
  useEffect(() => {
    if (filePath || isDebugMode) {
      loadPageData(currentPage);
    }
  }, [currentPage, searchKeyword, filePath, isDebugMode]);

  // 初始化暗黑模式
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // 转换数据格式
  const jsonlData = {
    filename: filePath || '调试数据',
    totalLines: fileData.total,
    currentPage: currentPage,
    totalPages: totalPages,
    rows: fileData.data
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 标题栏 */}
      <TitleBar
        darkMode={darkMode}
        isDebugMode={isDebugMode}
        onToggleDarkMode={toggleDarkMode}
        onToggleDebugMode={toggleDebugMode}
        onGenerateTestFile={handleGenerateTestFile}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <div className="mt-16">
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            onSettingsClick={() => setShowSettings(true)}
            onHistoryClick={() => setShowHistory(true)}
            onHelpClick={() => setShowHelp(true)}
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium mb-3">{loadingText}</p>
                
                {/* 进度条 */}
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
          )}

          {!filePath && !isDebugMode ? (
            <div className="flex-1 flex items-center justify-center mt-16">
              <div 
                onClick={handleOpenFile}
                className="group relative w-full max-w-2xl p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                  <h2 className="text-2xl font-semibold mb-2">打开 JSONL 文件</h2>
                  <p className="text-muted-foreground mb-4">点击或拖拽文件到此处</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden mt-16">
              <JsonlViewer
                data={jsonlData}
                activeView={activeView}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
                onClose={() => {
                  setFilePath(null);
                  setIsDebugMode(false);
                }}
                onExport={() => {
                  // TODO: 实现导出功能
                  console.log('导出功能待实现');
                }}
                onGenerate={handleGenerateTestFile}
              />
            </div>
          )}
        </div>
      </div>

      {/* 设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="pageSize" className="text-right">
                每页显示:
              </label>
              <Input
                id="pageSize"
                type="number"
                min="10"
                max="1000"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value) || 100)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 历史记录对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>历史记录</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">最近打开的文件将显示在这里</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 帮助对话框 */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>帮助</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">基本操作</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>点击"打开 JSONL 文件"按钮或拖拽文件到界面</li>
                <li>使用搜索框搜索 JSON 内容</li>
                <li>使用分页栏浏览数据</li>
                <li>切换视图模式（表格/网格/图表）</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">快捷键</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Ctrl + O: 打开文件</li>
                <li>Ctrl + F: 搜索</li>
                <li>Ctrl + S: 保存</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHelp(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 生成测试文件对话框 */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>生成测试 JSONL 文件</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="lines" className="text-right">
                行数:
              </label>
              <Input
                id="lines"
                type="number"
                min="1"
                max="100000"
                value={lineCount}
                onChange={(e) => setLineCount(parseInt(e.target.value) || 1000)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              取消
            </Button>
            <Button onClick={generateFile}>
              生成文件
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 