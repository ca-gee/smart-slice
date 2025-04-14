export interface JsonlData {
  filename: string;
  totalLines: number;
  currentPage: number;
  totalPages: number;
  rows: JsonObject[];
}

export interface JsonObject {
  [key: string]: any;
}

export interface JsonlStats {
  totalLines: number;
  currentPage: number;
  totalPages: number;
}

export interface JsonlSearchResult {
  rows: JsonObject[];
  total: number;
}

export interface JsonlPageRequest {
  page: number;
  pageSize: number;
}

export interface JsonlSearchRequest extends JsonlPageRequest {
  query: string;
} 