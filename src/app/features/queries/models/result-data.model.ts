export interface ResultData {
  format_version: string;
  tables: ResultTable[];
  metadata: ResultMetadata;
}

export interface ResultTable {
  table_id: string;
  title: string;
  description?: string;
  columns: ResultColumn[];
  rows: unknown[][];
  row_count: number;
  source_step_ids: string[];
}

export interface ResultColumn {
  key: string;
  label: string;
  data_type: 'string' | 'number' | 'boolean' | 'datetime' | 'array';
  sortable?: boolean;
}

export interface ResultMetadata {
  total_records: number;
  integrations_queried: IntegrationQueried[];
  execution_duration_ms: number;
}

export interface IntegrationQueried {
  integration_id: string;
  display_name: string;
  server_type: string;
}
