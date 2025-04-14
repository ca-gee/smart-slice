use crate::jsonl::JsonlReaderManager;
use crate::models::PagedResponse;
use tauri::{State, AppHandle, Emitter};
use std::path::Path;

/// 设置当前 JSONL 文件
#[tauri::command]
pub async fn set_jsonl_file(
    app_handle: AppHandle,
    path: &str,
    manager: State<'_, JsonlReaderManager>
) -> Result<bool, String> {
    println!("尝试打开文件: {}", path);
    
    // 验证文件是否存在
    if !Path::new(path).exists() {
        let err = format!("文件不存在: {}", path);
        println!("错误: {}", err);
        return Err(err);
    }

    // 验证文件是否可读
    if let Err(e) = std::fs::metadata(path) {
        let err = format!("无法获取文件信息: {}, 错误: {}", path, e);
        println!("错误: {}", err);
        return Err(err);
    }
    
    // 使用带进度报告的设置读取器
    manager.set_reader_with_progress(path, move |progress| {
        // 发送进度事件到前端 - 使用Tauri 2.0的API
        let _ = app_handle.emit("jsonl-loading-progress", &progress);
    })
    .await
    .map(|_| {
        println!("成功打开文件: {}", path);
        true
    })
    .map_err(|e| {
        let err = format!("打开文件失败: {}, 错误: {}", path, e);
        println!("错误: {}", err);
        err.to_string()
    })
}

/// 加载指定页的数据
#[tauri::command]
pub async fn load_page(
    page: usize,
    page_size: usize,
    manager: State<'_, JsonlReaderManager>
) -> Result<PagedResponse, String> {
    println!("加载页面数据: 页码={}, 每页行数={}", page, page_size);
    
    let result = manager.load_page(page, page_size).await;
    
    match &result {
        Ok(response) => {
            println!("成功加载数据: 总行数={}, 当前页数据条数={}", 
                     response.total, response.data.len());
        }
        Err(e) => {
            println!("加载数据失败: 错误={}", e);
        }
    }
    
    result.map_err(|e| e.to_string())
}

/// 搜索并加载匹配的数据
#[tauri::command]
pub async fn search_page(
    keyword: &str,
    page: usize,
    page_size: usize,
    manager: State<'_, JsonlReaderManager>
) -> Result<PagedResponse, String> {
    println!("搜索数据: 关键词='{}', 页码={}, 每页行数={}", keyword, page, page_size);
    
    let result = manager.search(keyword, page, page_size).await;
    
    match &result {
        Ok(response) => {
            println!("搜索成功: 匹配行数={}, 当前页数据条数={}", 
                     response.total, response.data.len());
        }
        Err(e) => {
            println!("搜索失败: 错误={}", e);
        }
    }
    
    result.map_err(|e| e.to_string())
}

/// 获取文件总行数
#[tauri::command]
pub async fn get_total_lines(
    manager: State<'_, JsonlReaderManager>
) -> Result<usize, String> {
    println!("获取文件总行数");
    
    let result = manager.total_lines().await;
    
    match &result {
        Ok(total) => {
            println!("总行数: {}", total);
        }
        Err(e) => {
            println!("获取总行数失败: 错误={}", e);
        }
    }
    
    result.map_err(|e| e.to_string())
} 