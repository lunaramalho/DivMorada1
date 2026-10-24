export function storedPhotoUrl(value?: string | null): string | null {
  if (!value || !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) return null;
    return value;
  } catch { return null; }
}
