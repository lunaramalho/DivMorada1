import { parseRecoveryLink } from './recoveryLink';

// Tokens never enter route params, logs or persistent storage.
let pending: { url: string; receivedAt: number } | null = null;
let sequence = 0;

export function captureNativeRecovery(path: string, now = Date.now()): string | null {
  let url: URL;
  try { url = new URL(path, 'divmorada://'); } catch { return null; }
  const target = `${url.hostname}${url.pathname}`;
  if (!target.endsWith('reset-password')) return null;
  try {
    parseRecoveryLink(url.toString());
    pending = { url: url.toString(), receivedAt: now };
    return `/reset-password?recoveryAttempt=${++sequence}`;
  } catch {
    pending = null;
    return '/reset-password';
  }
}

export function takeNativeRecovery(now = Date.now()): string | null {
  const link = pending;
  pending = null;
  return link && now - link.receivedAt <= 5 * 60 * 1000 ? link.url : null;
}
