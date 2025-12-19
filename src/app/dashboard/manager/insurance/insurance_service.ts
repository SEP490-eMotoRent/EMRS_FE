const API_PREFIX = "/api/InsuranceClaim";

export async function getBranchClaims() {
  const res = await fetch(`${API_PREFIX}/manager/branch-claims`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch claims");
  }

  const json = await res.json();
  return json.data || [];
}

export async function getClaimById(id: string) {
  const res = await fetch(`${API_PREFIX}/manager/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch claim details");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Failed to fetch claim details");
  }
  return json.data;
}

export async function updateClaim(id: string, data: FormData) {
  const res = await fetch(`${API_PREFIX}/manager/update`, {
    method: "PUT",
    body: data,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(text || "Failed to update claim");
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update claim");
  }

  return json;
}

export async function settleClaim(id: string, data: FormData) {
  const res = await fetch(`${API_PREFIX}/manager/settlement`, {
    method: "PUT",
    body: data,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(text || "Failed to settle claim");
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to settle claim");
  }

  return json;
}
