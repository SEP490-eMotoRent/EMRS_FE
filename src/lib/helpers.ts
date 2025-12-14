/**
 * Lấy token từ cookies (client-side)
 */
function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Gọi trực tiếp backend Azure từ client-side
 * Thay thế cho việc gọi qua Next.js API routes
 */
export async function fetchBackend(path: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || 
    "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";
  
  const token = getTokenFromCookies();
  
  const url = `${base}${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });
  
  return response;
}
