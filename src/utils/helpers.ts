/**
 * Lấy base URL cho API backend (Azure)
 * FE KHÔNG sử dụng API nội bộ Next.js, nên chỉ cần NEXT_PUBLIC_API_URL
 */
export function getInternalApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    console.error("❌ ERROR: NEXT_PUBLIC_API_URL is not set!");
    throw new Error("API base URL is not configured");
  }

  return base;
}
