import { clearAuthState, setAuthTokens } from "../features/auth/authStore";

const API_BASE = import.meta.env.VITE_SERVER_URL || "";
const REFRESH_URL = "/api/auth/refresh";

interface ApiErrorOptions {
  status: number;
  code: string;
  message: string;
  data?: unknown;
}

interface ApiEnvelope {
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
  };
  errorCode?: string;
  code?: string;
  message?: string;
}

type ApiClientParams =
  | Record<string, string | number | boolean | null | undefined>
  | URLSearchParams;

interface ApiClientOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  params?: ApiClientParams;
  timeout?: number;
  includeAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

interface ApiClientResponse<TData = unknown> {
  status: number;
  headers: Headers;
  data: TData;
}

class ApiError extends Error {
  status: number;
  code: string;
  data?: unknown;

  constructor({ status, code, message, data }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const defaultOptions = {
  timeout: 20000,
};

let refreshPromise: Promise<string> | null = null;

const asApiEnvelope = (data: unknown): ApiEnvelope | null =>
  data && typeof data === "object" ? (data as ApiEnvelope) : null;

const unwrapApiData = (data: unknown) => asApiEnvelope(data)?.data ?? data;

const parseResponseBody = async (response: Response): Promise<unknown> => {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.clone().json();
    }

    const text = await response.clone().text();
    return text || null;
  } catch {
    return null;
  }
};

const getErrorCode = (data: unknown) => {
  const payload = asApiEnvelope(data);
  return payload?.error?.code || payload?.errorCode || payload?.code || "REQUEST_FAILED";
};

const getErrorMessage = (response: Response, data: unknown) => {
  const fallbackMessage =
    response.status === 401
      ? "인증이 필요합니다. 다시 로그인해주세요."
      : "요청에 실패했습니다.";

  const payload = asApiEnvelope(data);
  return payload?.error?.message || payload?.message || fallbackMessage;
};

const toQueryString = (params?: ApiClientParams) => {
  if (!params) {
    return "";
  }

  return `?${new URLSearchParams(params as Record<string, string>).toString()}`;
};

const refreshAccessToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE}${REFRESH_URL}`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: getErrorCode(data),
      message: getErrorMessage(response, data),
      data,
    });
  }

  const authData = unwrapApiData(data) as { accessToken?: string } | null;
  if (!authData?.accessToken) {
    throw new ApiError({
      status: response.status,
      code: "ACCESS_TOKEN_MISSING",
      message: "응답에 access token이 포함되지 않았습니다.",
      data,
    });
  }

  setAuthTokens({ accessToken: authData.accessToken });
  return authData.accessToken;
};

const refreshAccessTokenOnce = () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const apiClient = async <TData = unknown>(
  url: string,
  {
    method = "GET",
    headers = {},
    body,
    params,
    timeout = defaultOptions.timeout,
    includeAuth = true,
    retryOnUnauthorized = true,
  }: ApiClientOptions = {},
): Promise<ApiClientResponse<TData>> => {
  const accessToken = localStorage.getItem("accessToken");
  const normalizedMethod = method.toUpperCase();

  const hasBody =
    body !== undefined &&
    body !== null &&
    normalizedMethod !== "GET" &&
    normalizedMethod !== "HEAD";

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const queryString = toQueryString(params);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${url}${queryString}`, {
      method: normalizedMethod,
      headers: {
        ...(includeAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(!isFormData && hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      credentials: "include",
    });
  } catch (error) {
    clearTimeout(timer);

    const isTimeoutError = error instanceof Error && error.name === "AbortError";

    throw new ApiError({
      status: 0,
      code: isTimeoutError ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
      message: isTimeoutError
        ? "요청 시간이 초과되었습니다."
        : "서버에 연결할 수 없습니다.",
    });
  }

  clearTimeout(timer);

  const data = await parseResponseBody(response);
  const errorCode = getErrorCode(data);
  const canRefresh =
    includeAuth &&
    retryOnUnauthorized &&
    url !== REFRESH_URL &&
    response.status === 401 &&
    errorCode === "TOKEN_EXPIRED";

  if (canRefresh) {
    try {
      await refreshAccessTokenOnce();

      return apiClient<TData>(url, {
        method: normalizedMethod,
        headers,
        body,
        params,
        timeout,
        includeAuth,
        retryOnUnauthorized: false,
      });
    } catch {
      clearAuthState();
      throw new ApiError({
        status: 401,
        code: "SESSION_EXPIRED",
        message: "로그인이 만료되었습니다. 다시 로그인해주세요.",
      });
    }
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: errorCode,
      message: getErrorMessage(response, data),
      data,
    });
  }

  return {
    status: response.status,
    headers: response.headers,
    data: data as TData,
  };
};

export { ApiError, apiClient };
export type { ApiClientOptions, ApiClientParams, ApiClientResponse };
