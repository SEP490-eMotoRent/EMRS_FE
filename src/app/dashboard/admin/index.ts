// API_BASE_URL sẽ được thay thế bằng API thật khi code admin
// Hiện tại để trống, các service sẽ cần được cập nhật để gọi API thật
export const API_BASE_URL = "";

export async function fetchData(endpoint: string) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return res.json();
}
