use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("文件 I/O 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON 解析错误: {0}")]
    Json(#[from] serde_json::Error),

    #[error("无效的 JSONL 文件")]
    InvalidJsonl,

    #[error("文件不存在")]
    FileNotFound,

    #[error("页码超出范围")]
    PageOutOfRange,

    #[error("调试数据生成错误: {0}")]
    DebugError(String),

    #[error("一般错误: {0}")]
    General(String),
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::General(err.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>; 