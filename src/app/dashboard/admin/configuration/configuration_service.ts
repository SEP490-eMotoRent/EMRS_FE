const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/configuration";

function buildUrl(path = "") {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export enum ConfigurationType {
  FacePlusPlus = 1,
  RentingDurationRate,
  ChargingRate,
  DepositRate,
  AdditionalFee,
  RefundRate,
  EconomyDepositPrice,
  StandardDepositPrice,
  PremiumDepositPrice,
  LateReturnFee,
  CleaningFee,
  DamageFee,
  CrossBranchFee,
  ExcessKmFee,
  EarlyHandoverFee,
  RentalContractTemplate,
}

export const configurationTypeOptions = [
  { label: "Tỉ lệ thuê theo thời lượng", value: ConfigurationType.RentingDurationRate },
  { label: "Đơn giá sạc", value: ConfigurationType.ChargingRate },
  { label: "Tỉ lệ đặt cọc", value: ConfigurationType.DepositRate },
  { label: "Phụ phí", value: ConfigurationType.AdditionalFee },
  { label: "Tỉ lệ hoàn tiền", value: ConfigurationType.RefundRate },
  { label: "Đặt cọc xe Economy", value: ConfigurationType.EconomyDepositPrice },
  { label: "Đặt cọc xe Standard", value: ConfigurationType.StandardDepositPrice },
  { label: "Đặt cọc xe Premium", value: ConfigurationType.PremiumDepositPrice },
  { label: "Phí trả trễ", value: ConfigurationType.LateReturnFee },
  { label: "Phí vệ sinh", value: ConfigurationType.CleaningFee },
  { label: "Phí hư hỏng", value: ConfigurationType.DamageFee },
  { label: "Phí trả xe khác chi nhánh", value: ConfigurationType.CrossBranchFee },
  { label: "Phí vượt km", value: ConfigurationType.ExcessKmFee },
  { label: "Phí trả sớm", value: ConfigurationType.EarlyHandoverFee },
  { label: "File hợp đồng thuê", value: ConfigurationType.RentalContractTemplate },
];

export interface ConfigurationItem {
  id: string;
  title: string;
  description: string;
  type: ConfigurationType;
  value: string;
  updatedAt?: string | null;
  createdAt?: string;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || "Có lỗi xảy ra");
  }

  return json.data || json;
}

export async function getConfigurations(): Promise<ConfigurationItem[]> {
  const res = await fetch(buildUrl(""), { cache: "no-store" });
  return handleResponse(res);
}

export async function createConfiguration(
  payload: Omit<ConfigurationItem, "id" | "createdAt" | "updatedAt">
) {
  const res = await fetch(buildUrl(""), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateConfiguration(
  id: string,
  payload: Omit<ConfigurationItem, "id" | "createdAt" | "updatedAt">
) {
  const res = await fetch(buildUrl(""), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...payload }),
  });
  return handleResponse(res);
}

export async function deleteConfiguration(id: string) {
  const res = await fetch(buildUrl(`/${id}`), {
    method: "DELETE",
  });
  return handleResponse(res);
}

