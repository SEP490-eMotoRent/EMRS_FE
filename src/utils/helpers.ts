export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Lấy base URL cho internal API calls (Next.js API routes)
 * Ưu tiên: NEXT_PUBLIC_APP_URL > VERCEL_URL > window.location.origin > localhost
 */
export function getInternalApiBase(): string {
  // Server-side: ưu tiên NEXT_PUBLIC_APP_URL, sau đó VERCEL_URL
  if (typeof window === 'undefined') {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    );
  }
  
  // Client-side: ưu tiên NEXT_PUBLIC_APP_URL, sau đó window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}