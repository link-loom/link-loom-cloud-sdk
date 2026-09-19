import { sha256Hex } from "../shared/runtime-ids";

const VERIFIED_CACHE_PREFIX = "stoneos:identity-verified:";

const decodeTokenExpiry = (token) => {
  const [, payloadSegment] = String(token).split(".");
  if (!payloadSegment || typeof atob === "undefined") {
    return null;
  }

  try {
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

// Normalizes the Veripass session (`useAuth().getToken()`) into what the runtime needs.
// Returns null when there is no usable session, so apps keep working without identity.
export const readIdentitySession = (rawSession) => {
  if (!rawSession?.token || !rawSession?.identity) {
    return null;
  }

  const organizationId = rawSession.memberships?.active?.organization_id || rawSession.payload?.organization_id || null;
  const profile = rawSession.payload?.profile || {};

  return {
    token: rawSession.token,
    veripassIdentity: rawSession.identity,
    organizationId,
    userId: rawSession.payload?.user_id || rawSession.identity,
    expiresAt: decodeTokenExpiry(rawSession.token),
    memberships: rawSession.memberships?.items || [],
    profile,
  };
};

export const isIdentityExpired = (identitySession, now = Date.now()) =>
  Boolean(identitySession?.expiresAt && identitySession.expiresAt <= now);

export const buildIdentityHeaders = (identitySession, sessionId) => {
  if (!identitySession) {
    return {};
  }

  const headers = { Authorization: `Bearer ${identitySession.token}` };
  if (identitySession.organizationId) {
    headers["x-veripass-organization-identity"] = identitySession.organizationId;
  }
  if (sessionId) {
    headers["x-loom-app-session"] = sessionId;
  }
  return headers;
};

export const buildSdkIdentity = (identitySession, directoryProfile) => {
  if (!identitySession) {
    return null;
  }

  const profile = { ...identitySession.profile, ...(directoryProfile || {}) };

  return {
    id: identitySession.veripassIdentity,
    veripassIdentity: identitySession.veripassIdentity,
    userId: identitySession.userId,
    organizationId: identitySession.organizationId,
    displayName: profile.display_name || profile.primary_email_address || identitySession.veripassIdentity,
    username: profile.username || null,
    avatarUrl: profile.avatar_url || null,
    email: profile.email || profile.primary_email_address || null,
    memberships: identitySession.memberships,
  };
};

const verifiedCacheKey = async (token) => `${VERIFIED_CACHE_PREFIX}${await sha256Hex(token)}`;

export const readVerifiedIdentity = async (identitySession, now = Date.now()) => {
  if (!identitySession || typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const entry = JSON.parse(sessionStorage.getItem(await verifiedCacheKey(identitySession.token)));
    if (!entry || !entry.expires_at || entry.expires_at <= now) {
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

export const writeVerifiedIdentity = async (identitySession, profile) => {
  if (!identitySession || typeof sessionStorage === "undefined") {
    return;
  }

  const expiresAt = identitySession.expiresAt || Date.now() + 5 * 60 * 1000;

  try {
    sessionStorage.setItem(
      await verifiedCacheKey(identitySession.token),
      JSON.stringify({ expires_at: expiresAt, profile: profile || null }),
    );
  } catch {
    // Session storage full or blocked: verification simply runs again next time.
  }
};

export const clearVerifiedIdentities = () => {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(VERIFIED_CACHE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
};

// A 2xx from the directory proxy proves the LLC backend accepted the token for this organization.
export const verifyIdentityWithBackend = async ({ httpClient, identitySession }) =>
  httpClient.request({
    path: "/identity/directory/user",
    query: { veripass_identity: identitySession.veripassIdentity },
  });
