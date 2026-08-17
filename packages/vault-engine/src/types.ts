export interface VaultFileMetadata {
  filePath: string;
  relativePath: string;
  fileName: string;
  category: string;
  title: string;
  domain?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  summary?: string;
  hasFrontmatter: boolean;
}

export interface DomainIndex {
  domain: string;
  title: string;
  description: string;
  files: VaultFileMetadata[];
}

export interface Tier2CachePayload<T = unknown> {
  schema_version: string;
  category: string;
  generated_at: string;
  expires_at: string;
  quick_summary_tts: string;
  data?: T;
  [key: string]: unknown;
}

export interface HealthIssue {
  type: 'missing_frontmatter' | 'broken_link' | 'missing_index' | 'empty_summary';
  filePath: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface VaultHealthReport {
  totalFiles: number;
  indexedFiles: number;
  healthy: boolean;
  issues: HealthIssue[];
}
