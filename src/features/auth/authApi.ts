import { apiClient } from "../../api/client";
import {
  confirmEmailVerification as generatedConfirmEmailVerification,
  confirmPasswordReset as generatedConfirmPasswordReset,
  createMember as generatedCreateMember,
  getCurrentMember as generatedGetCurrentMember,
  login as generatedLogin,
  logoutCurrentSession as generatedLogoutCurrentSession,
  sendEmailVerification as generatedSendEmailVerification,
  sendPasswordReset as generatedSendPasswordReset,
} from "../../api/generated/member/member";

const unwrapResponse = (response: any) => response?.data?.data ?? null;

const normalizeOAuthProvider = (provider: unknown) => String(provider || "").toLowerCase();

async function fetchOAuthAuthorizeUrlApi(provider: string) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const response = await apiClient(
    `/api/auth/oauth/${normalizedProvider}/authorize`,
  );

  return unwrapResponse(response);
}

async function refreshSessionApi() {
  const response = await apiClient("/api/auth/refresh", {
    method: "POST",
    body: {},
    includeAuth: false,
    retryOnUnauthorized: false,
  });

  return unwrapResponse(response);
}

async function fetchKakaoAuthorizeUrlApi() {
  return fetchOAuthAuthorizeUrlApi("KAKAO");
}

async function fetchGoogleAuthorizeUrlApi() {
  return fetchOAuthAuthorizeUrlApi("GOOGLE");
}

async function loginApi({ email, password }: { email: string; password: string }) {
  const response = await generatedLogin({ email, password });

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
}: {
  email: string;
  password: string;
  nickname: string;
  phone?: string | null;
  address?: string | null;
  profileImageKey?: string | null;
  role?: "USER" | "SELLER" | "ADMIN";
}) {
  const response = await generatedCreateMember({
    email,
    password,
    nickname,
    ...(phone ? { phone } : {}),
    ...(address ? { address } : {}),
    ...(profileImageKey ? { profileImageKey } : {}),
    role,
  });

  return unwrapResponse(response);
}

async function sendEmailVerificationApi({ email }: { email: string }) {
  const response = await generatedSendEmailVerification({ email });

  return unwrapResponse(response);
}

async function confirmEmailVerificationApi({ token }: { token: string }) {
  const response = await generatedConfirmEmailVerification({ token });

  return unwrapResponse(response);
}

async function requestPasswordResetApi({ email }: { email: string }) {
  const response = await generatedSendPasswordReset({ email });

  return unwrapResponse(response);
}

async function confirmPasswordResetApi({
  token,
  newPassword,
}: {
  token: string;
  newPassword: string;
}) {
  const response = await generatedConfirmPasswordReset({ token, newPassword });

  return unwrapResponse(response);
}

async function getMyInfoApi() {
  const response = await generatedGetCurrentMember();

  return unwrapResponse(response);
}

async function logoutApi() {
  const response = await generatedLogoutCurrentSession();

  return unwrapResponse(response);
}

export {
  confirmPasswordResetApi,
  confirmEmailVerificationApi,
  fetchGoogleAuthorizeUrlApi,
  fetchKakaoAuthorizeUrlApi,
  fetchOAuthAuthorizeUrlApi,
  getMyInfoApi,
  loginApi,
  logoutApi,
  requestPasswordResetApi,
  refreshSessionApi,
  sendEmailVerificationApi,
  signupApi,
};
