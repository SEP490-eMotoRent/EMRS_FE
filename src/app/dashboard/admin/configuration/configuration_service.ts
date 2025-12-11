const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/configuration";

function buildUrl(path = "") {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

// Enum mirror from backend (EMRS.Domain.Enums.ConfigurationTypeEnum)
// Keep names readable for UI mapping.
export enum ConfigurationType {
  FacePlusPlus = 1, // hiện tại backend đang bỏ, giữ để tránh crash map
  RentingDurationRate = 2,
  ChargingRate = 3,
  DepositRate = 5,
  AdditionalFee = 6,
  RefundRate = 7,
  EconomyDepositPrice = 8,
  StandardDepositPrice = 9,
  PremiumDepositPrice = 10,
  OffPeakChargingPrice = 11,
  NormalChargingPrice = 12,
  PeakChargingPrice = 13,
  RentalContractTemplate = 17,
  LateReturnPrice = 18,
  CleaningPrice = 19,
  DamagePrice = 20,
  CrossBranchPrice = 21,
  EconomyExcessKmPrice = 22,
  StandardExcessKmPrice = 23,
  PreniumExcessKmPrice = 24,
  EconomyExcessKmLimit = 25,
  StandardExcessKmLimit = 26,
  PreniumExcessKmLimit = 27,
}

export const configurationTypeOptions = [
  { label: "Tỉ lệ thuê theo thời lượng", value: ConfigurationType.RentingDurationRate },
  { label: "Đơn giá sạc", value: ConfigurationType.ChargingRate },
  { label: "Đơn giá sạc thấp điểm", value: ConfigurationType.OffPeakChargingPrice },
  { label: "Đơn giá sạc bình thường", value: ConfigurationType.NormalChargingPrice },
  { label: "Đơn giá sạc cao điểm", value: ConfigurationType.PeakChargingPrice },
  { label: "Tỉ lệ đặt cọc", value: ConfigurationType.DepositRate },
  { label: "Phụ phí", value: ConfigurationType.AdditionalFee },
  { label: "Tỉ lệ hoàn tiền", value: ConfigurationType.RefundRate },
  { label: "Đặt cọc xe Economy", value: ConfigurationType.EconomyDepositPrice },
  { label: "Đặt cọc xe Standard", value: ConfigurationType.StandardDepositPrice },
  { label: "Đặt cọc xe Premium", value: ConfigurationType.PremiumDepositPrice },
  { label: "Phí trả xe trễ", value: ConfigurationType.LateReturnPrice },
  { label: "Phí vệ sinh", value: ConfigurationType.CleaningPrice },
  { label: "Phí hư hỏng", value: ConfigurationType.DamagePrice },
  { label: "Phí trả xe khác chi nhánh", value: ConfigurationType.CrossBranchPrice },
  { label: "Giới hạn km cơ sở/ngày - Economy", value: ConfigurationType.EconomyExcessKmLimit },
  { label: "Giới hạn km cơ sở/ngày - Standard", value: ConfigurationType.StandardExcessKmLimit },
  { label: "Giới hạn km cơ sở/ngày - Premium", value: ConfigurationType.PreniumExcessKmLimit },
  { label: "Phí vượt km - Economy", value: ConfigurationType.EconomyExcessKmPrice },
  { label: "Phí vượt km - Standard", value: ConfigurationType.StandardExcessKmPrice },
  { label: "Phí vượt km - Premium", value: ConfigurationType.PreniumExcessKmPrice },
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
  _isTemplate?: boolean;
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

export async function getConfigurationById(
  id: string
): Promise<ConfigurationItem> {
  const res = await fetch(buildUrl(`/${id}`), { cache: "no-store" });
  return handleResponse(res);
}

export async function getConfigurationByType(
  type: string | ConfigurationType
): Promise<ConfigurationItem[]> {
  const res = await fetch(buildUrl(`/type/${type}`), { cache: "no-store" });
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

export async function createConfigurationMedia(payload: {
  title: string;
  description: string;
  type: string | ConfigurationType;
  file: File;
}) {
  const formData = new FormData();
  formData.append("Title", payload.title);
  formData.append("Description", payload.description);
  formData.append("Type", String(payload.type));
  formData.append("File", payload.file);

  const res = await fetch(buildUrl("/media"), {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function updateConfigurationMedia(payload: {
  id: string;
  title: string;
  description: string;
  type: string | ConfigurationType;
  file: File;
}) {
  const formData = new FormData();
  formData.append("Id", payload.id);
  formData.append("Title", payload.title);
  formData.append("Description", payload.description);
  formData.append("Type", String(payload.type));
  formData.append("File", payload.file);

  const res = await fetch(buildUrl("/media"), {
    method: "PUT",
    body: formData,
  });
  return handleResponse(res);
}

