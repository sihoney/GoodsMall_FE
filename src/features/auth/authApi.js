import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

const normalizeOAuthProvider = (provider) => String(provider || "").toLowerCase();

async function fetchOAuthAuthorizeUrlApi(provider) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const response = await apiClient(
    `/api/auth/oauth/${normalizedProvider}/authorize`,
  );

  return unwrapResponse(response);
}

async function fetchOAuthLinkAuthorizeUrlApi(provider) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const response = await apiClient(
    `/api/auth/oauth/${normalizedProvider}/link/authorize-url`,
  );

  return unwrapResponse(response);
}

async function fetchOAuthResultApi({ provider, resultKey }) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const response = await apiClient(`/api/auth/oauth/${normalizedProvider}/result`, {
    params: { resultKey },
  });

  return unwrapResponse(response);
}

async function linkOAuthAccountApi({ provider, linkToken }) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const response = await apiClient(`/api/auth/oauth/${normalizedProvider}/link`, {
    method: "POST",
    body: { linkToken },
  });

  return unwrapResponse(response);
}

async function fetchKakaoAuthorizeUrlApi() {
  return fetchOAuthAuthorizeUrlApi("KAKAO");
}

async function fetchGoogleAuthorizeUrlApi() {
  return fetchOAuthAuthorizeUrlApi("GOOGLE");
}

async function fetchKakaoLinkAuthorizeUrlApi() {
  return fetchOAuthLinkAuthorizeUrlApi("KAKAO");
}

async function fetchKakaoOAuthResultApi({ resultKey }) {
  return fetchOAuthResultApi({ provider: "KAKAO", resultKey });
}

async function loginApi({ email, password }) {
  const response = await apiClient("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  return unwrapResponse(response);
}

async function signupApi({
  email,
  password,
  nickname,
  phone = null,
  address = null,
  profileImageKey = null,
  role = "USER",
}) {
  const response = await apiClient("/api/members", {
    method: "POST",
    body: {
      email,
      password,
      nickname,
      phone,
      address,
      profileImageKey,
      role,
    },
  });

  return unwrapResponse(response);
}

async function sendEmailVerificationApi({ email }) {
  const response = await apiClient("/api/auth/email-verifications", {
    method: "POST",
    body: { email },
  });

  return unwrapResponse(response);
}

async function confirmEmailVerificationApi({ token }) {
  const response = await apiClient("/api/auth/email-verifications/confirm", {
    method: "POST",
    body: { token },
  });

  return unwrapResponse(response);
}

async function requestPasswordResetApi({ email }) {
  const response = await apiClient("/api/auth/password-resets", {
    method: "POST",
    body: { email },
  });

  return unwrapResponse(response);
}

async function confirmPasswordResetApi({ token, newPassword }) {
  const response = await apiClient("/api/auth/password-resets/confirm", {
    method: "POST",
    body: { token, newPassword },
  });

  return unwrapResponse(response);
}

async function getMyInfoApi() {
  const response = await apiClient("/api/members/me");

  return unwrapResponse(response);
}

async function logoutApi() {
  const response = await apiClient("/api/auth/logout/current", {
    method: "POST",
  });

  return unwrapResponse(response);
}

async function linkKakaoAccountApi({ linkToken }) {
  return linkOAuthAccountApi({ provider: "KAKAO", linkToken });
}

export {
  confirmPasswordResetApi,
  confirmEmailVerificationApi,
  fetchGoogleAuthorizeUrlApi,
  fetchKakaoAuthorizeUrlApi,
  fetchKakaoLinkAuthorizeUrlApi,
  fetchKakaoOAuthResultApi,
  fetchOAuthAuthorizeUrlApi,
  fetchOAuthLinkAuthorizeUrlApi,
  fetchOAuthResultApi,
  getMyInfoApi,
  linkOAuthAccountApi,
  linkKakaoAccountApi,
  loginApi,
  logoutApi,
  requestPasswordResetApi,
  sendEmailVerificationApi,
  signupApi,
};
