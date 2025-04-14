use crate::models::{AppResult, AppError, JsonObject, PagedResponse};
use std::collections::HashMap;
use serde_json::Value as JsonValue;
use std::sync::Arc;
use tokio::sync::Mutex;

/// 调试数据生成器
pub struct DebugDataGenerator {
    /// 总行数
    total_rows: usize,
    /// 是否已加载调试数据
    is_loaded: bool,
}

impl DebugDataGenerator {
    /// 创建新的调试数据生成器，默认10000条数据
    pub fn new(total_rows: Option<usize>) -> Self {
        Self {
            total_rows: total_rows.unwrap_or(10000),
            is_loaded: false,
        }
    }
    
    /// 生成随机字符串
    fn random_string(prefix: &str, index: usize) -> String {
        format!("{}{}", prefix, index)
    }
    
    /// 生成随机布尔值
    fn random_bool(index: usize) -> bool {
        index % 2 == 0
    }
    
    /// 生成随机数值
    fn random_number(index: usize) -> i64 {
        (index as i64) * 10 + (index as i64 % 7)
    }
    
    /// 生成随机对象
    fn generate_object(index: usize) -> JsonObject {
        let mut obj = HashMap::new();
        
        // 基础字段
        obj.insert("id".to_string(), JsonValue::Number(serde_json::Number::from(index)));
        obj.insert("name".to_string(), JsonValue::String(Self::random_string("用户-", index)));
        obj.insert("email".to_string(), JsonValue::String(format!("user{}@example.com", index)));
        
        // 状态字段
        let status = match index % 4 {
            0 => "活跃",
            1 => "非活跃",
            2 => "已封禁",
            _ => "待验证",
        };
        obj.insert("status".to_string(), JsonValue::String(status.to_string()));
        
        // 数值字段
        obj.insert("score".to_string(), JsonValue::Number(serde_json::Number::from(Self::random_number(index))));
        obj.insert("visits".to_string(), JsonValue::Number(serde_json::Number::from(index % 100)));
        
        // 布尔字段
        obj.insert("isAdmin".to_string(), JsonValue::Bool(Self::random_bool(index)));
        obj.insert("isVerified".to_string(), JsonValue::Bool(index % 3 == 0));
        
        // 日期字段
        let year = 2020 + (index % 3);
        let month = 1 + (index % 12);
        let day = 1 + (index % 28);
        obj.insert("createdAt".to_string(), JsonValue::String(format!("{}-{:02}-{:02}", year, month, day)));
        
        // 嵌套对象
        let mut address = HashMap::new();
        address.insert("city".to_string(), JsonValue::String(format!("城市-{}", index % 10)));
        address.insert("zipCode".to_string(), JsonValue::String(format!("{:05}", index % 100000)));
        obj.insert("address".to_string(), JsonValue::Object(address.into_iter().collect()));
        
        // 数组
        let tags = vec![
            JsonValue::String(format!("标签-{}", index % 5)),
            JsonValue::String(format!("分类-{}", index % 3)),
        ];
        obj.insert("tags".to_string(), JsonValue::Array(tags));
        
        obj
    }
    
    /// 生成分页数据
    pub fn generate_page(&self, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        if page == 0 {
            return Err(AppError::General("页码从1开始".to_string()));
        }
        
        let start_idx = (page - 1) * page_size;
        if start_idx >= self.total_rows {
            return Err(AppError::PageOutOfRange);
        }
        
        let end_idx = std::cmp::min(start_idx + page_size, self.total_rows);
        
        let mut data = Vec::with_capacity(end_idx - start_idx);
        for i in start_idx..end_idx {
            data.push(Self::generate_object(i));
        }
        
        Ok(PagedResponse {
            data,
            total: self.total_rows,
        })
    }
    
    /// 搜索关键词（模拟）
    pub fn search(&self, keyword: &str, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        // 模拟搜索，只返回约20%的数据作为"匹配"结果
        let matched_total = self.total_rows / 5;
        
        let start_idx = (page - 1) * page_size;
        if start_idx >= matched_total {
            return Err(AppError::PageOutOfRange);
        }
        
        let end_idx = std::cmp::min(start_idx + page_size, matched_total);
        
        // 为搜索结果生成一些看起来匹配关键词的数据
        let mut data = Vec::with_capacity(end_idx - start_idx);
        for i in start_idx..end_idx {
            let mut obj = Self::generate_object(i);
            
            // 确保生成的数据包含搜索关键词
            let highlight_field = match i % 3 {
                0 => "name",
                1 => "email",
                _ => "status",
            };
            
            if let Some(JsonValue::String(old_value)) = obj.get(highlight_field) {
                let new_value = format!("{}{}{}", old_value, keyword, i);
                obj.insert(highlight_field.to_string(), JsonValue::String(new_value));
            }
            
            data.push(obj);
        }
        
        Ok(PagedResponse {
            data,
            total: matched_total,
        })
    }
}

/// 调试数据管理器
pub struct DebugDataManager {
    generator: Arc<Mutex<Option<DebugDataGenerator>>>,
}

impl DebugDataManager {
    /// 创建新的调试数据管理器
    pub fn new() -> Self {
        Self {
            generator: Arc::new(Mutex::new(None)),
        }
    }
    
    /// 初始化调试数据生成器
    pub async fn init_debug_data(&self, total_rows: Option<usize>) -> AppResult<()> {
        let generator = DebugDataGenerator::new(total_rows);
        let mut guard = self.generator.lock().await;
        *guard = Some(generator);
        Ok(())
    }
    
    /// 获取分页调试数据
    pub async fn load_debug_page(&self, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        let guard = self.generator.lock().await;
        match &*guard {
            Some(generator) => generator.generate_page(page, page_size),
            None => Err(AppError::DebugError("调试数据未初始化".to_string())),
        }
    }
    
    /// 搜索调试数据
    pub async fn search_debug(&self, keyword: &str, page: usize, page_size: usize) -> AppResult<PagedResponse> {
        let guard = self.generator.lock().await;
        match &*guard {
            Some(generator) => generator.search(keyword, page, page_size),
            None => Err(AppError::DebugError("调试数据未初始化".to_string())),
        }
    }
    
    /// 获取调试数据总行数
    pub async fn debug_total_rows(&self) -> AppResult<usize> {
        let guard = self.generator.lock().await;
        match &*guard {
            Some(generator) => Ok(generator.total_rows),
            None => Err(AppError::DebugError("调试数据未初始化".to_string())),
        }
    }
} 