/**
 * Response Normalizers - Safe consumption of backend API responses
 * 
 * Handles:
 * - Nested vs flat object structures
 * - Type coercion and validation
 * - Safe array mapping
 * - Empty/null value handling
 * - Prevention of raw object rendering
 */

/**
 * Auth Login Response Normalizer
 * Canonical backend returns:
 * { success: true, data: { accessToken, user: { id, email, role, organizationId } } }
 * Legacy fallback:
 * { accessToken, user: { id, email, role, organizationId } }
 */
export function normalizeLoginResponse(raw: any): {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
} {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid login response structure');
  }

  const payload = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  const accessToken = String(payload.accessToken || payload.token || '');
  if (!accessToken) {
    throw new Error('No access token in response');
  }

  const user = payload.user || {};
  if (typeof user !== 'object') {
    throw new Error('Invalid user data in response');
  }

  return {
    accessToken,
    user: {
      id: String(user.id || user.userId || ''),
      email: String(user.email || ''),
      role: String(user.role || 'user').toLowerCase(),
      organizationId: String(user.organizationId || user.organization_id || ''),
    },
  };
}

/**
 * Auth Me Response Normalizer
 * Backend returns: { user: { id, role, organizationId, sessionId? } }
 */
export function normalizeAuthMeResponse(raw: any): {
  userId: string;
  role: string;
  organizationId: string;
  sessionId: string | null;
} {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid auth/me response structure');
  }

  const user = raw.user || raw;
  if (typeof user !== 'object') {
    throw new Error('Invalid user data in response');
  }

  return {
    userId: String(user.id || user.userId || ''),
    role: String(user.role || 'user').toLowerCase(),
    organizationId: String(user.organizationId || user.organization_id || 'org_placeholder'),
    sessionId: user.sessionId || user.session_id || null,
  };
}

/**
 * Canonical Error Response Normalizer
 * Backend returns: { error: { code, message, context? } }
 */
export function normalizeErrorResponse(raw: any): {
  code: string;
  message: string;
  context?: Record<string, any>;
} {
  if (!raw || typeof raw !== 'object') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };
  }

  // Handle wrapped error format
  const error = raw.error || raw;
  if (typeof error !== 'object') {
    return {
      code: 'UNKNOWN_ERROR',
      message: String(raw.message || raw.error || 'An error occurred'),
    };
  }

  return {
    code: String(error.code || 'ERROR').toUpperCase(),
    message: String(error.message || 'An error occurred'),
    context: error.context && typeof error.context === 'object' ? error.context : undefined,
  };
}

/**
 * List Response Normalizer (generic pagination)
 * Backend returns: { data: [...], count, total? } or { items: [...], total } or [...]
 */
export function normalizeListResponse<T = any>(raw: any): {
  items: T[];
  count: number;
  total?: number;
} {
  if (!raw || typeof raw !== 'object') {
    return { items: [], count: 0 };
  }

  // Handle array response
  if (Array.isArray(raw)) {
    return { items: raw as T[], count: raw.length };
  }

  // Handle { data, count } format
  if (Array.isArray(raw.data)) {
    return {
      items: raw.data as T[],
      count: raw.count ?? raw.data.length,
      total: raw.total,
    };
  }

  // Handle { items, total } format
  if (Array.isArray(raw.items)) {
    return {
      items: raw.items as T[],
      count: raw.items.length,
      total: raw.total ?? raw.count,
    };
  }

  // Fallback
  return { items: [], count: 0 };
}

/**
 * Detail Response Normalizer (wraps single object)
 * Backend returns: { data: {...} } or {...}
 */
export function normalizeDetailResponse<T = any>(raw: any): T {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid detail response structure');
  }

  // Unwrap if nested in 'data'
  if (raw.data && typeof raw.data === 'object') {
    return raw.data as T;
  }

  return raw as T;
}

/**
 * Metrics/Summary Response Normalizer
 * Handles various metric formats: { metrics: {} }, { data: {} }, or { ...metrics }
 */
export function normalizeMetricsResponse<T = any>(raw: any): T {
  if (!raw || typeof raw !== 'object') {
    return {} as T;
  }

  // Unwrap common wrappers
  if (raw.metrics && typeof raw.metrics === 'object') {
    return raw.metrics as T;
  }

  if (raw.data && typeof raw.data === 'object') {
    return raw.data as T;
  }

  return raw as T;
}

/**
 * Safe date parsing - handles string or timestamp
 */
export function parseDate(value: any): Date | null {
  if (!value) return null;
  try {
    if (typeof value === 'string') {
      return new Date(value);
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Safe number parsing
 */
export function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Safe boolean parsing
 */
export function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
  }
  return Boolean(value);
}

/**
 * Safe array parsing - ensures result is always an array
 */
export function parseArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.values(value) as T[];
  }
  return [];
}

/**
 * Safe string rendering - never returns raw object
 */
export function renderSafeString(value: any): string {
  if (value === null || value === undefined) return '—';
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} item${value.length !== 1 ? 's' : ''}]`;
    }
    return '[Object]';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    if (value > 1_000_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value > 1_000_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }

  return String(value);
}

/**
 * Safe currency formatting - cents to dollars
 */
export function formatCurrency(cents: any, currency: string = 'USD'): string {
  const num = parseNumber(cents);
  if (num === null) return '—';

  const dollars = num / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Safe percentage formatting
 */
export function formatPercentage(value: any, decimalPlaces: number = 1): string {
  const num = parseNumber(value);
  if (num === null) return '—';
  return `${num.toFixed(decimalPlaces)}%`;
}

/**
 * Check if response looks like an error (used before JSON parsing)
 */
export function looksLikeHtmlError(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<title>') ||
    trimmed.includes('<body>')
  );
}

/**
 * Type-safe API error class
 */
export class APIErrorWithContext extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>,
    public originalError?: any
  ) {
    super(message);
    this.name = 'APIErrorWithContext';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}
