import { supabase } from './supabase';

// Stored legacy URLs identify objects only. Never use their public endpoint for display.
export function storedObjectPath(value: string, baseURL = process.env.EXPO_PUBLIC_SUPABASE_URL): string | null {
  try {
    if (!baseURL) return null;
    const url = new URL(value);
    const project = new URL(baseURL);
    const prefix = '/storage/v1/object/public/comprovantes/';
    if (url.origin !== project.origin || !url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path || path.split('/').some(part => part === '..' || part === '.')) return null;
    return path;
  } catch { return null; }
}

export async function protectedFileURL(value: string): Promise<string> {
  const path = storedObjectPath(value);
  if (!path) throw new Error('O endereço deste arquivo não pertence ao armazenamento da residência.');
  const { data, error } = await supabase.storage.from('comprovantes').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error('Não foi possível acessar o arquivo. Confira sua participação na residência e tente novamente.');
  return data.signedUrl;
}
