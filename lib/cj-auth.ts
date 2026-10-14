type CJTokenResponse = {
  success?: boolean;
  result?: boolean;
  code?: number;
  message?: string;
  data?: {
    accessToken?: string;
    accessTokenExpiryDate?: string;
    refreshToken?: string;
    refreshTokenExpiryDate?: string;
  } | null;
};

type CachedTokens = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
};

let cached: CachedTokens | null = null;
let pending: Promise<string> | null = null;
const API = "https://developers.cjdropshipping.com/api2.0/v1/authentication";

function expiry(value?: string, fallback = 0): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requestToken(path: string, body: Record<string, string>): Promise<CJTokenResponse> {
  const response = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as CJTokenResponse | null;
  if (!response.ok || !payload || payload.code !== 200 || payload.success === false || payload.result === false || !payload.data) {
    throw new Error(`CJ token request failed (HTTP ${response.status}; code ${payload?.code ?? "unknown"}).`);
  }
  return payload;
}

function store(payload: CJTokenResponse, previous?: CachedTokens): CachedTokens {
  const data = payload.data;
  if (!data?.accessToken || !data.refreshToken) throw new Error("CJ response omitted access or refresh token.");
  const now = Date.now();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessExpiresAt: expiry(data.accessTokenExpiryDate, now + 170 * 86400000),
    refreshExpiresAt: expiry(data.refreshTokenExpiryDate, previous?.refreshExpiresAt || now + 170 * 86400000),
  };
}

/** Server-only in-memory token cache; tokens are never exposed to client responses. */
export async function getCJAccessToken(): Promise<string> {
  const apiKey = (process.env.CJ_API_KEY || process.env.CJ_DROPSHIPPING_API_KEY)?.trim();
  if (!apiKey) throw new Error("CJ API key is not configured on the server.");
  if (cached && cached.accessExpiresAt > Date.now() + 5 * 60_000) return cached.accessToken;
  if (pending) return pending;

  pending = (async () => {
    if (cached && cached.refreshExpiresAt > Date.now() + 5 * 60_000) {
      try {
        cached = store(await requestToken("refreshAccessToken", { refreshToken: cached.refreshToken }), cached);
        return cached.accessToken;
      } catch {
        // Re-authenticate with the API key if refresh is rejected or unavailable.
      }
    }
    cached = store(await requestToken("getAccessToken", { apiKey }), cached ?? undefined);
    return cached.accessToken;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}
