export async function emrsFetch(path: string, options: RequestInit = {}) {
  /**
   * Ưu tiên đọc từ biến môi trường:
   * - EMRS_API_URL (server only)
   * - NEXT_PUBLIC_API_URL (dùng chung FE/BE)
   * Nếu chưa cấu hình, fallback sang URL BE mặc định (Swagger bạn đang dùng).
   */
  const envBase =
    process.env.EMRS_API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  const defaultBase =
    "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

  const base = envBase && envBase.length > 0 ? envBase : defaultBase;

  const url = `${base}${path}`;

  // Log nhẹ để debug trên server (sẽ thấy trong terminal chạy `npm run dev`)
  if (process.env.NODE_ENV !== "production") {
    console.log("[emrsFetch] ->", url);
  }

  return fetch(url, { ...options, cache: "no-store" });
}

