const OAUTH_LINK_STORAGE_KEY = "oauthPendingLink";
const LEGACY_KAKAO_LINK_STORAGE_KEY = "kakaoPendingLink";

function parseStoredLink(rawValue, storageKey) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

function getPendingOAuthLink() {
  if (typeof window === "undefined") {
    return null;
  }

  const pendingLink = parseStoredLink(
    window.sessionStorage.getItem(OAUTH_LINK_STORAGE_KEY),
    OAUTH_LINK_STORAGE_KEY,
  );

  if (pendingLink) {
    return pendingLink;
  }

  const legacyKakaoLink = parseStoredLink(
    window.sessionStorage.getItem(LEGACY_KAKAO_LINK_STORAGE_KEY),
    LEGACY_KAKAO_LINK_STORAGE_KEY,
  );

  return legacyKakaoLink ? { provider: "KAKAO", ...legacyKakaoLink } : null;
}

function setPendingOAuthLink(payload) {
  if (typeof window === "undefined") {
    return;
  }

  if (!payload?.linkToken) {
    clearPendingOAuthLink();
    return;
  }

  window.sessionStorage.setItem(
    OAUTH_LINK_STORAGE_KEY,
    JSON.stringify({
      ...payload,
      provider: payload.provider || "KAKAO",
    }),
  );
}

function clearPendingOAuthLink() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(OAUTH_LINK_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_KAKAO_LINK_STORAGE_KEY);
}

function getPendingKakaoLink() {
  return getPendingOAuthLink();
}

function setPendingKakaoLink(payload) {
  setPendingOAuthLink({ provider: "KAKAO", ...payload });
}

function clearPendingKakaoLink() {
  clearPendingOAuthLink();
}

export {
  clearPendingKakaoLink,
  clearPendingOAuthLink,
  getPendingKakaoLink,
  getPendingOAuthLink,
  setPendingKakaoLink,
  setPendingOAuthLink,
};
