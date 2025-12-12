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
 * Ưu tiên: NEXT_PUBLIC_APP_URL > window.location.origin (client) > VERCEL_URL (server) > localhost
 * 
 * LƯU Ý: NEXT_PUBLIC_APP_URL phải được set trên Vercel để hoạt động đúng!
 */
export function getInternalApiBase(): string {
  // Client-side: luôn dùng window.location.origin nếu không có NEXT_PUBLIC_APP_URL
  if (typeof window !== 'undefined') {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    // Debug log (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[getInternalApiBase] Client-side:', { 
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        windowOrigin: window.location.origin,
        result: base
      });
    }
    return base;
  }
  
  // Server-side: ưu tiên NEXT_PUBLIC_APP_URL, sau đó VERCEL_URL
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
  // Debug log (chỉ trong development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getInternalApiBase] Server-side:', { 
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      result: base
    });
  }
  return base;
}