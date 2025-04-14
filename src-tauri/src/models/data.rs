use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 通用 JSON 数据类型
pub type JsonValue = serde_json::Value;

/// 通用 JSON 对象类型
pub type JsonObject = HashMap<String, JsonValue>;

/// 分页响应数据
#[derive(Debug, Serialize, Deserialize)]
pub struct PagedResponse {
    /// 当前页数据
    pub data: Vec<JsonObject>,
    
    /// 总行数
    pub total: usize,
}

/// 分页请求参数
#[derive(Debug, Serialize, Deserialize)]
pub struct PageRequest {
    /// 页码，从1开始
    pub page: usize,
    
    /// 每页行数
    pub page_size: usize,
}

/// 搜索请求参数
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    /// 搜索关键词
    pub keyword: String,
    
    /// 页码，从1开始
    pub page: usize,
    
    /// 每页行数
    pub page_size: usize,
}

/// 文件加载进度通知
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadingProgress {
    /// 当前处理的行数
    pub current: usize,
    
    /// 预计总行数
    pub total: usize,
    
    /// 当前阶段
    pub stage: String,
    
    /// 进度百分比 (0-100)
    pub percentage: f32,
} 