export function formatHttpError(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'error' in err) {
    const httpErr = err as { error?: unknown; message?: string; status?: number };
    const body = httpErr.error;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
    if (typeof httpErr.error === 'string' && httpErr.error.trim().length > 0) {
      return httpErr.error;
    }
    if (httpErr.message) {
      return httpErr.message;
    }
    if (httpErr.status != null) {
      return `Request failed (${httpErr.status}).`;
    }
  }
  return fallback;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function toDatetimeLocalValue(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toTimeInputValue(value: string | null): string {
  if (!value?.trim()) {
    return '';
  }
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  const parsed = new Date(`1970-01-01T${trimmed}`);
  if (!Number.isNaN(parsed.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }
  return '';
}

export function formatHumidityRange(
  hlow: number | null | undefined,
  hhigh: number | null | undefined,
): string {
  if (hlow == null && hhigh == null) {
    return '—';
  }
  if (hlow != null && hhigh != null) {
    return `${hlow}–${hhigh}%`;
  }
  if (hlow != null) {
    return `≥ ${hlow}%`;
  }
  return `≤ ${hhigh}%`;
}

export function formatTemperatureRange(
  tlow: number | null | undefined,
  thigh: number | null | undefined,
): string {
  if (tlow == null && thigh == null) {
    return '—';
  }
  if (tlow != null && thigh != null) {
    return `${tlow}–${thigh}°C`;
  }
  if (tlow != null) {
    return `≥ ${tlow}°C`;
  }
  return `≤ ${thigh}°C`;
}

export function displayValue(value: string | null | undefined): string {
  return value?.trim() || '—';
}

export function entityLabel(
  name: string | null | undefined,
  code: string | null | undefined,
  id: number,
): string {
  return name?.trim() || code?.trim() || `#${id}`;
}
