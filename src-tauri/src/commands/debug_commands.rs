use crate::jsonl::DebugDataManager;
use crate::models::PagedResponse;
use tauri::State;
use std::fs::File;
use std::io::{Write, BufWriter};
use std::path::Path;

/// 初始化调试数据
#[tauri::command]
pub async fn init_debug_data(
    rows: Option<usize>,
    debug_manager: State<'_, DebugDataManager>
) -> Result<bool, String> {
    debug_manager.init_debug_data(rows)
        .await
        .map(|_| true)
        .map_err(|e| e.to_string())
}

/// 加载调试分页数据
#[tauri::command]
pub async fn load_debug_page(
    page: usize,
    page_size: usize,
    debug_manager: State<'_, DebugDataManager>
) -> Result<PagedResponse, String> {
    debug_manager.load_debug_page(page, page_size)
        .await
        .map_err(|e| e.to_string())
}

/// 搜索调试数据
#[tauri::command]
pub async fn search_debug_page(
    keyword: &str,
    page: usize,
    page_size: usize,
    debug_manager: State<'_, DebugDataManager>
) -> Result<PagedResponse, String> {
    debug_manager.search_debug(keyword, page, page_size)
        .await
        .map_err(|e| e.to_string())
}

/// 获取调试数据总行数
#[tauri::command]
pub async fn get_debug_total_rows(
    debug_manager: State<'_, DebugDataManager>
) -> Result<usize, String> {
    debug_manager.debug_total_rows()
        .await
        .map_err(|e| e.to_string())
}

/// 生成测试 JSONL 文件
#[tauri::command]
pub async fn generate_test_jsonl(
    path: &str,
    lines: usize,
    debug_manager: State<'_, DebugDataManager>
) -> Result<String, String> {
    println!("生成测试 JSONL 文件: 路径={}, 行数={}", path, lines);
    
    // 验证路径
    let output_path = Path::new(path);
    if let Some(parent) = output_path.parent() {
        if !parent.exists() {
            let err = format!("目录不存在: {}", parent.display());
            println!("错误: {}", err);
            return Err(err);
        }
    }
    
    // 初始化测试数据生成器
    debug_manager.init_debug_data(Some(lines)).await
        .map_err(|e| {
            let err = format!("初始化调试数据失败: {}", e);
            println!("错误: {}", err);
            err.to_string()
        })?;
    
    // 创建输出文件
    let file = match File::create(output_path) {
        Ok(f) => f,
        Err(e) => {
            let err = format!("创建文件失败: {}, 错误: {}", path, e);
            println!("错误: {}", err);
            return Err(err);
        }
    };
    
    let mut writer = BufWriter::new(file);
    let batch_size = 1000; // 每批处理的行数
    let batches = (lines + batch_size - 1) / batch_size; // 向上取整
    
    println!("开始写入 JSONL 数据: {} 批, 每批最多 {} 行", batches, batch_size);
    
    // 分批生成和写入数据
    let mut remaining = lines;
    let mut offset = 0;
    
    for batch in 0..batches {
        let current_batch_size = std::cmp::min(batch_size, remaining);
        
        if current_batch_size <= 0 {
            break;
        }
        
        println!("生成批次 {}/{}: 行 {}-{}", 
                 batch + 1, batches, 
                 offset, 
                 offset + current_batch_size - 1);
        
        // 使用页码1，因为每次我们只请求一页数据，但通过改变总行数来获取正确的数据片段
        // 为当前批次临时设置行数为current_batch_size
        debug_manager.init_debug_data(Some(current_batch_size)).await
            .map_err(|e| {
                let err = format!("初始化批次数据失败: {}", e);
                println!("错误: {}", err);
                err.to_string()
            })?;
        
        // 获取这一批的数据，总是使用页码1
        let response = debug_manager.load_debug_page(1, current_batch_size).await
            .map_err(|e| {
                let err = format!("生成批次数据失败: {}", e);
                println!("错误: {}", err);
                err.to_string()
            })?;
        
        // 修改id字段，确保整个文件的id是连续的
        for (i, obj) in response.data.iter().enumerate() {
            // 先将对象克隆出来以便修改
            let mut modified_obj = obj.clone();
            
            // 修改id字段，使其在整个文件中是连续的
            if let Some(id_value) = modified_obj.get_mut("id") {
                if let serde_json::Value::Number(num) = id_value {
                    if let Some(n) = num.as_u64() {
                        let new_id = offset + i;
                        *id_value = serde_json::Value::Number(serde_json::Number::from(new_id));
                    }
                }
            }
            
            // 序列化并写入文件
            let json_line = serde_json::to_string(&modified_obj)
                .map_err(|e| {
                    let err = format!("序列化 JSON 失败: {}", e);
                    println!("错误: {}", err);
                    err.to_string()
                })?;
            
            writeln!(writer, "{}", json_line)
                .map_err(|e| {
                    let err = format!("写入文件失败: {}", e);
                    println!("错误: {}", err);
                    err.to_string()
                })?;
        }
        
        // 更新剩余行数和偏移量
        remaining -= current_batch_size;
        offset += current_batch_size;
        
        // 每批次结束后刷新缓冲区
        writer.flush()
            .map_err(|e| {
                let err = format!("刷新文件缓冲区失败: {}", e);
                println!("错误: {}", err);
                err.to_string()
            })?;
    }
    
    // 恢复原始的总行数设置
    debug_manager.init_debug_data(Some(lines)).await
        .map_err(|e| {
            let err = format!("重置调试数据失败: {}", e);
            println!("错误: {}", err);
            err.to_string()
        })?;
    
    println!("成功生成 JSONL 测试文件: {}", path);
    Ok(format!("成功生成包含 {} 行的 JSONL 文件: {}", lines, path))
} 