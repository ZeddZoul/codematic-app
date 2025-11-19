/**
 * Compliance Error Types and Interfaces
 */

export enum ComplianceErrorType {
  MISSING_FILE = 'MISSING_FILE',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_CONTENT = 'INVALID_CONTENT',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface ComplianceError {
  type: ComplianceErrorType;
  message: string;
  details?: string;
  file?: string;
  retryAfter?: number; // For rate limit errors (in seconds)
}