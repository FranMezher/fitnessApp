import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore has a 2048-byte limit per item on iOS.
// Supabase sessions can exceed this, so we chunk large values.
const CHUNK_SIZE = 1800;

async function clearAllChunks(key: string): Promise<void> {
  const prev = await SecureStore.getItemAsync(`${key}_chunks`);
  if (!prev) return;
  const n = parseInt(prev, 10);
  if (!Number.isFinite(n) || n <= 0) {
    await SecureStore.deleteItemAsync(`${key}_chunks`);
    return;
  }
  await Promise.all(
    Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
  );
  await SecureStore.deleteItemAsync(`${key}_chunks`);
}

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunkCount) {
      const n = parseInt(chunkCount, 10);
      const parts = await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`))
      );
      return parts.some((p) => p === null) ? null : parts.join('');
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // Always wipe previous chunks first so stale data from a longer prior value
    // can't be read back mixed with the new value.
    await clearAllChunks(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    // Remove any non-chunked value at the base key to avoid ambiguity.
    await SecureStore.deleteItemAsync(key);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    // Write chunks first; only then write the counter so a crash mid-write
    // leaves the previous (now-deleted) state instead of a partial read.
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)));
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
  },
  removeItem: async (key: string): Promise<void> => {
    await clearAllChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
