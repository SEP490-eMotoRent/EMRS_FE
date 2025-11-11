export interface InsuranceClaim {
  id: string;
  status: string;
  incidentDate: string;
  incidentLocation: string;
  renterName: string;
  renterPhone: string;
  vehicleModelName: string;
  licensePlate: string;
  bookingId: string;
  handoverBranchName: string;
  createdAt: string;
}

const BASE_URL = "/api/InsuranceClaim";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 🟢 Lấy danh sách sự cố
export async function getBranchClaims(): Promise<InsuranceClaim[]> {
  const res = await fetch(`${BASE_URL}/manager/branch-claims`, {
    headers: { ...getAuthHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể lấy danh sách sự cố");
  const json = await res.json();
  return json.data ?? [];
}

// 🟡 Lấy chi tiết sự cố
export async function getClaimById(id: string): Promise<InsuranceClaim> {
  const res = await fetch(`${BASE_URL}/manager/${id}`, {
    headers: { ...getAuthHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể tải chi tiết hồ sơ");
  const json = await res.json();
  return json.data;
}

// 🔧 Cập nhật hồ sơ (multipart)
export async function updateClaim(id: string, data: any) {
  const formData = new FormData();

  // 🟢 Map sang đúng key API
  const keyMap: Record<string, string> = {
    Description: "description",
    IncidentLocation: "incidentLocation",
    Severity: "severity",
    Status: "status",
    Notes: "notes",
    RejectionReason: "rejectionReason",
    AdditionalImageFiles: "additionalImageFiles",
  };

  Object.keys(data).forEach((key) => {
    const mapped = keyMap[key] || key;
    const value = data[key];

    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(mapped, item));
      } else {
        formData.append(mapped, value);
      }
    }
  });

  console.log("🟦 Sending FormData:");
  for (const [k, v] of formData.entries()) console.log("→", k, v);

  const res = await fetch(`/api/InsuranceClaim/manager/${id}`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  const text = await res.text();
  console.log("🔵 Response:", text);

  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

// 🟣 Nhập kết quả bồi thường
// 🟣 Hoàn tất quyết toán (Manager)
export async function settleClaim(id: string, data: any) {
  const formData = new FormData();

  const keyMap: Record<string, string> = {
    VehicleDamageCost: "vehicleDamageCost",
    PersonInjuryCost: "personInjuryCost",
    ThirdPartyCost: "thirdPartyCost",
    InsuranceCoverageAmount: "insuranceCoverageAmount",
    InsuranceClaimPdfFile: "insuranceClaimPdfFile",
  };

  Object.keys(data).forEach((key) => {
    const mapped = keyMap[key] || key;
    const value = data[key];
    if (value !== undefined && value !== null) {
      formData.append(mapped, value);
    }
  });

  console.log("🟣 Settlement FormData:");
  for (const [k, v] of formData.entries()) console.log("→", k, v);

  const res = await fetch(`/api/InsuranceClaim/manager/${id}/settlement`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  const text = await res.text();
  console.log("🟩 Response:", text);

  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

