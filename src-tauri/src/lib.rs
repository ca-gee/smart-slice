// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// 定义模块
pub mod models;
pub mod jsonl;
pub mod commands;

use jsonl::{JsonlReaderManager, DebugDataManager};
use commands::*;

// Tauri 应用程序入口点
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建全局状态
    let jsonl_manager = JsonlReaderManager::new();
    let debug_manager = DebugDataManager::new();

    tauri::Builder::default()
        // 添加插件
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        
        // 管理全局状态
        .manage(jsonl_manager)
        .manage(debug_manager)
        
        // 注册命令处理器
        .invoke_handler(tauri::generate_handler![
            // JSONL 文件处理命令
            set_jsonl_file,
            load_page,
            search_page,
            get_total_lines,
            
            // 调试数据命令
            init_debug_data,
            load_debug_page,
            search_debug_page,
            get_debug_total_rows,
            generate_test_jsonl,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri 应用运行失败");
}
