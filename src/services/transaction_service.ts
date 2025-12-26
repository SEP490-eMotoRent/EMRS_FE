import { fetchBackend } from "@/utils/helpers";

export interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  docNo: string;
  status: string;
  createdAt: string;
}

interface TransactionApiResponse {
  success?: boolean;
  data?: Transaction[];
  code?: number;
  [key: string]: any;
}

// Lấy toàn bộ transaction (sử dụng cẩn thận nếu dữ liệu rất lớn)
export async function getAllTransactions(): Promise<Transaction[]> {
  const res = await fetchBackend("/Transaction");

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch transactions:", res.status, errorText);
    throw new Error("Failed to fetch transactions");
  }

  const text = await res.text();
  let json: TransactionApiResponse | Transaction[];

  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("Failed to parse transactions JSON:", text);
    throw new Error("Invalid transactions response");
  }

  // { success: true, data: [...] }
  if (!Array.isArray(json) && json.success && Array.isArray(json.data)) {
    return json.data;
  }

  // Fallback: backend trả trực tiếp array
  if (Array.isArray(json)) {
    return json as Transaction[];
  }

  console.warn("Unexpected transactions response shape:", json);
  return [];
}

// Lấy danh sách giao dịch liên quan tới một chứng từ (ví dụ bookingId)
export async function getTransactionsByDocNo(
  docNo: string
): Promise<Transaction[]> {
  if (!docNo) return [];

  const all = await getAllTransactions();

  return all.filter((tx) => tx.docNo === docNo);
}
