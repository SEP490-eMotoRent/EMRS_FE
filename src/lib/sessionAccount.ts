import { fetchBackend } from "./helpers";

export type AccountDetail = {
  id?: string;
  username?: string;
  fullname?: string;
  fullName?: string;
  branchName?: string;
  staff?: {
    id?: string;
    branch?: {
      branchName?: string;
    };
  };
};

export function readBrowserCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  return document.cookie.split(";").reduce<Record<string, string>>((acc, c) => {
    const [key, value] = c.trim().split("=");
    if (key && value !== undefined) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}

async function fetchAccountDetailById(accountId: string | undefined | null) {
  if (!accountId) return null;
  try {
    const res = await fetchBackend(`/account/${accountId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data || json) as AccountDetail;
  } catch (err) {
    console.warn("[sessionAccount] fetch detail failed:", err);
    return null;
  }
}

async function fetchAccountList() {
  try {
    const res = await fetchBackend("/account");
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data ?? json;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.warn("[sessionAccount] fetch list failed:", err);
    return [];
  }
}

/**
 * Try to resolve the current account detail using whatever info exists in cookies.
 * Handles old sessions that accidentally stored staffId instead of accountId.
 */
export async function resolveAccountFromSession(
  cookiesMap?: Record<string, string>
) {
  const cookies = cookiesMap ?? readBrowserCookies();
  const tried = new Set<string>();

  const candidateAccountIds = [
    cookies.accountId,
    cookies.userId,
  ].filter(Boolean) as string[];

  for (const candidate of candidateAccountIds) {
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    const detail = await fetchAccountDetailById(candidate);
    if (detail) {
      if (detail.id && candidate !== detail.id) {
        document.cookie = `userId=${detail.id}; path=/;`;
      }
      return detail;
    }
  }

  // Fallback: fetch account list and try to match by staffId or username
  const accounts = await fetchAccountList();
  if (!accounts.length) return null;

  const loweredUsername = cookies.username?.toLowerCase();
  const match =
    accounts.find((acc: any) => acc.id === cookies.userId) ||
    accounts.find((acc: any) => acc.staff?.id === cookies.userId) ||
    accounts.find((acc: any) => acc.staff?.id === cookies.staffId) ||
    accounts.find(
      (acc: any) =>
        loweredUsername &&
        typeof acc.username === "string" &&
        acc.username.toLowerCase() === loweredUsername
    );

  if (!match) return null;

  if (match.id && !tried.has(match.id)) {
    const detail = await fetchAccountDetailById(match.id);
    if (detail) {
      document.cookie = `userId=${detail.id}; path=/;`;
      return detail;
    }
  }

  return match as AccountDetail;
}

