const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/insurance-claim";

// Helper build URL tuyệt đối cho fetch phía server
function buildUrl(path: string) {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export async function getBranchClaims() {
  const res = await fetch(buildUrl("/manager/branch-claims"), {
    cache: "no-store",
  });

  const json = await res.json();
  return json.data || [];
}

export async function getClaimById(id: string) {
  const res = await fetch(buildUrl(`/manager/${id}`), { cache: "no-store" });
  return (await res.json()).data;
}

export async function updateClaim(id: string, data: any) {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => form.append(k, v as any));

  const res = await fetch(buildUrl(`/manager/${id}`), {
    method: "PUT",
    body: form,
  });

  const text = await res.text();
  return JSON.parse(text);
}

export async function settleClaim(id: string, data: any) {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => form.append(k, v as any));

  const res = await fetch(buildUrl(`/manager/${id}/settlement`), {
    method: "PUT",
    body: form,
  });

  const text = await res.text();
  return JSON.parse(text);
}
