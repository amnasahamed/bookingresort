// Global auth lock to prevent race conditions in Supabase
// Supabase gotrue-js uses IndexedDB locks that can conflict with concurrent calls

let authPromise: Promise<any> | null = null;

export async function withAuthLock<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for any existing auth operation to complete
  while (authPromise) {
    try {
      await authPromise;
    } catch (e) {
      // Ignore errors from previous operations
    }
  }

  // Create new auth operation
  authPromise = fn();
  
  try {
    const result = await authPromise;
    return result;
  } finally {
    authPromise = null;
  }
}

// Sequential auth operations with small delay to release locks
export async function sequentialAuth<T>(operations: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  
  for (const op of operations) {
    try {
      const result = await op();
      results.push(result);
      // Small delay to let IndexedDB locks release
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (e) {
      results.push(e as T);
    }
  }
  
  return results;
}
