import { apiClient } from "./client";

type GeneratedResponse<TData = unknown> = {
  data: TData;
  status: number;
  headers: Headers;
};

const getHeaderValue = (headers: HeadersInit | undefined, name: string) => {
  if (!headers) {
    return "";
  }

  if (headers instanceof Headers) {
    return headers.get(name) || "";
  }

  const lowerName = name.toLowerCase();
  const entries = Array.isArray(headers) ? headers : Object.entries(headers);
  const match = entries.find(([key]) => key.toLowerCase() === lowerName);

  return match?.[1]?.toString() || "";
};

const normalizeBody = (body: BodyInit | null | undefined, headers?: HeadersInit) => {
  if (body === null || body === undefined) {
    return undefined;
  }

  const contentType = getHeaderValue(headers, "content-type");
  if (typeof body === "string" && contentType.includes("application/json")) {
    return JSON.parse(body);
  }

  return body;
};

const openapiMutator = async <TResponse>(
  url: string,
  options: RequestInit = {},
): Promise<TResponse> => {
  const response = await apiClient(url, {
    method: options.method || "GET",
    body: normalizeBody(options.body, options.headers),
    headers: options.headers,
  });

  return {
    data: response.data,
    status: response.status,
    headers: response.headers,
  } as TResponse;
};

export { openapiMutator };
export type { GeneratedResponse };
