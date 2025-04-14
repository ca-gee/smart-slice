use crate::models::{AppResult, AppError, JsonObject, PagedResponse, LoadingProgress};
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;
use std::time::{Duration, Instant};
use rayon::prelude::*;

/// JSONL 文件读取器
pub struct JsonlReader {
    /// 文件路径
    path: String,
    
    /// 文件总行数
    total_lines: usize,
    
    /// 文件句柄缓存
    file_handle: Arc<Mutex<Option<BufReader<File>>>>,
}

impl JsonlReader {
    /// 创建新的 JSONL 文件读取器
    pub fn new<P: AsRef<Path>>(path: P) -> AppResult<Self> {
        let path_str = path.as_ref().to_str()
            .ok_or_else(|| AppError::General("无效的文件路径".to_string()))?
            .to_string();
        
        println!("初始化 JSONL 文件读取器: {}", path_str);
        
        // 验证文件存在
        if !path.as_ref().exists() {
            println!("文件不存在: {}", path_str);
            return Err(AppError::FileNotFound);
        }
        
        // 打开文件
        let file = File::open(&path)?;
        let reader = BufReader::new(file);
        
        // 创建实例
        Ok(Self {
            path: path_str,
            total_lines: 0,
            file_handle: Arc::new(Mutex::new(Some(reader))),
        })
    }
    
    /// 计算文件总行数并报告进度
    pub fn count_lines_with_progress<F>(&mut self, progress_callback: F) -> AppResult<usize>
    where
        F: Fn(LoadingProgress) + Send + 'static,
    {
        println!("计算文件总行数...");
        
        // 估算文件大小和总行数
        let metadata = std::fs::metadata(&self.path)?;
        let file_size = metadata.len();
        
        // 打开新的文件句柄用于计数
        let file = File::open(&self.path)?;
        let mut reader = BufReader::new(file);
        
        let mut line_count = 0;
        let mut bytes_read = 0;
        let mut buffer = String::new();
        
        // 设置进度报告的时间间隔
        let progress_interval = Duration::from_millis(100);
        let start_time = Instant::now();
        let mut last_progress_time = start_time;
        
        // 估计的总行数（用于进度计算）
        let estimated_total = (file_size / 100).max(1); // 假设平均每行100字节
        
        // 报告初始进度
        progress_callback(LoadingProgress {
            current: 0,
            total: estimated_total as usize,
            stage: "计算文件行数".to_string(),
            percentage: 0.0,
        });
        
        // 逐行读取文件并计数
        loop {
            buffer.clear();
            match reader.read_line(&mut buffer) {
                Ok(0) => break, // 文件结束
                Ok(bytes) => {
                    line_count += 1;
                    bytes_read += bytes as u64;
                    
                    // 检查是否应该报告进度
                    let now = Instant::now();
                    if now.duration_since(last_progress_time) >= progress_interval {
                        last_progress_time = now;
                        
                        // 计算进度百分比
                        let percentage = if file_size > 0 {
                            (bytes_read as f32 / file_size as f32) * 100.0
                        } else {
                            0.0
                        };
                        
                        // 更新预估总行数
                        let new_estimate = if bytes_read > 0 {
                            (line_count as u64 * file_size / bytes_read) as usize
                        } else {
                            estimated_total as usize
                        };
                        
                        // 报告进度
                        progress_callback(LoadingProgress {
                            current: line_count,
                            total: new_estimate,
                            stage: "计算文件行数".to_string(),
                            percentage,
                        });
                    }
                },
                Err(e) => {
                    println!("读取行失败: {}", e);
                    return Err(AppError::Io(e));
                }
            }
        }
        
        // 报告最终进度
        progress_callback(LoadingProgress {
            current: line_count,
            total: line_count,
            stage: "文件行数计算完成".to_string(),
            percentage: 100.0,
        });
        
        println!("文件总行数: {}", line_count);
        
        // 更新总行数
        self.total_lines = line_count;
        
        Ok(line_count)
    }
    
    /// 获取文件总行数
    pub fn total_lines(&self) -> usize {
        self.total_lines
    }
    
    /// 加载指定页的数据
    pub fn load_page(&self, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        // 计算起始行和结束行
        let start_line = (page - 1) * page_size;
        let end_line = std::cmp::min(start_line + page_size, self.total_lines);
        
        // 页码超出范围
        if start_line >= self.total_lines {
            return Err(AppError::PageOutOfRange);
        }
        
        // 获取文件句柄
        let mut handle_guard = self.file_handle.lock().map_err(|_| {
            AppError::General("获取文件锁失败".to_string())
        })?;
        
        let reader = handle_guard.as_mut().ok_or_else(|| {
            AppError::General("文件句柄未初始化".to_string())
        })?;
        
        // 重置文件指针
        reader.seek(SeekFrom::Start(0))?;
        
        // 跳过起始行之前的数据
        for _ in 0..start_line {
            let mut line = String::new();
            reader.read_line(&mut line)?;
        }
        
        // 读取指定范围的行
        let mut data = Vec::with_capacity(end_line - start_line);
        for _ in start_line..end_line {
            let mut line = String::new();
            match reader.read_line(&mut line) {
                Ok(0) => break, // 文件结束
                Ok(_) => {
                    let line = line.trim();
                    if !line.is_empty() {
                        match serde_json::from_str::<JsonObject>(line) {
                            Ok(obj) => data.push(obj),
                            Err(e) => {
                                println!("JSON 解析错误: {}, 行内容: {}", e, line);
                            }
                        }
                    }
                }
                Err(e) => return Err(AppError::Io(e)),
            }
        }
        
        Ok(PagedResponse {
            data,
            total: self.total_lines,
        })
    }
    
    /// 搜索关键词并返回匹配的分页数据
    pub fn search(&self, keyword: &str, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        let keyword = keyword.to_lowercase();
        
        // 获取文件句柄
        let mut handle_guard = self.file_handle.lock().map_err(|_| {
            AppError::General("获取文件锁失败".to_string())
        })?;
        
        let reader = handle_guard.as_mut().ok_or_else(|| {
            AppError::General("文件句柄未初始化".to_string())
        })?;
        
        // 重置文件指针
        reader.seek(SeekFrom::Start(0))?;
        
        // 扫描整个文件，查找匹配的行
        let mut matching_lines = Vec::new();
        let mut line_num = 0;
        
        let mut line = String::new();
        while reader.read_line(&mut line)? > 0 {
            let trimmed = line.trim();
            if !trimmed.is_empty() {
                // 检查行是否包含关键词
                if trimmed.to_lowercase().contains(&keyword) {
                    matching_lines.push((line_num, trimmed.to_string()));
                }
            }
            line_num += 1;
            line.clear();
        }
        
        // 计算分页
        let total_matches = matching_lines.len();
        let start_idx = (page - 1) * page_size;
        let end_idx = std::cmp::min(start_idx + page_size, total_matches);
        
        // 页码超出范围
        if start_idx >= total_matches && total_matches > 0 {
            return Err(AppError::PageOutOfRange);
        }
        
        // 提取当前页的数据
        let mut data = Vec::with_capacity(end_idx - start_idx);
        for i in start_idx..end_idx {
            let (_, line) = &matching_lines[i];
            let obj: JsonObject = serde_json::from_str(line)?;
            data.push(obj);
        }
        
        Ok(PagedResponse {
            data,
            total: total_matches,
        })
    }
}

/// 全局 JSONL 读取器管理器
pub struct JsonlReaderManager {
    current_reader: TokioMutex<Option<JsonlReader>>,
}

impl JsonlReaderManager {
    /// 创建新的管理器
    pub fn new() -> Self {
        Self {
            current_reader: TokioMutex::new(None),
        }
    }
    
    /// 设置当前读取器
    pub async fn set_reader(&self, path: &str) -> AppResult<()> {
        let reader = JsonlReader::new(path)?;
        let mut guard = self.current_reader.lock().await;
        *guard = Some(reader);
        Ok(())
    }
    
    /// 带进度报告的设置读取器
    pub async fn set_reader_with_progress<F>(&self, path: &str, progress_callback: F) -> AppResult<()>
    where
        F: Fn(LoadingProgress) + Send + 'static,
    {
        // 创建读取器但不计算行数
        let mut reader = JsonlReader::new(path)?;
        
        // 计算行数并报告进度
        reader.count_lines_with_progress(progress_callback)?;
        
        // 设置为当前读取器
        let mut guard = self.current_reader.lock().await;
        *guard = Some(reader);
        
        Ok(())
    }
    
    /// 获取分页数据
    pub async fn load_page(&self, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        let guard = self.current_reader.lock().await;
        match &*guard {
            Some(reader) => reader.load_page(page, page_size),
            None => Err(AppError::General("未打开JSONL文件".to_string())),
        }
    }
    
    /// 搜索关键词
    pub async fn search(&self, keyword: &str, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        let guard = self.current_reader.lock().await;
        match &*guard {
            Some(reader) => reader.search(keyword, page, page_size),
            None => Err(AppError::General("未打开JSONL文件".to_string())),
        }
    }
    
    /// 获取当前文件的总行数
    pub async fn total_lines(&self) -> AppResult<usize> {
        let guard = self.current_reader.lock().await;
        match &*guard {
            Some(reader) => Ok(reader.total_lines()),
            None => Err(AppError::General("未打开JSONL文件".to_string())),
        }
    }
} 