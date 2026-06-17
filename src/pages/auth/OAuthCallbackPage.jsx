import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { getMyInfoApi, refreshSessionApi } from "../../features/auth/authApi";
import { setAuthState, setAuthTokens } from "../../features/auth/authStore";

const PROVIDER_CONFIG = {
  KAKAO: {
    label: "카카오",
    accentClass: "bg-[#FEE500] text-[#3C1E1E]",
    mark: "K",
  },
  GOOGLE: {
    label: "Google",
    accentClass: "border border-gray-200 bg-white text-[#4285F4]",
    mark: "G",
  },
};

function getProviderConfig(provider) {
  return (
    PROVIDER_CONFIG[provider] || {
      label: provider,
      accentClass: "bg-blue-100 text-blue-700",
      mark: provider.slice(0, 1),
    }
  );
}

export default function OAuthCallbackPage({ provider = "KAKAO" }) {
  const normalizedProvider = String(provider || "KAKAO").toUpperCase();
  const providerConfig = useMemo(
    () => getProviderConfig(normalizedProvider),
    [normalizedProvider],
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const errorCode = searchParams.get("errorCode");
  const errorMessage = searchParams.get("errorMessage");

  const consumedCallbackRef = useRef(null);
  const [message, setMessage] = useState(
    `${providerConfig.label} 로그인 정보를 확인하고 있어요...`,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeLogin() {
      if (success === "false") {
        setError(
          errorMessage ||
            `${providerConfig.label} 인증 처리에 실패했습니다.`,
        );
        return;
      }

      if (success !== "true") {
        setError("잘못된 OAuth 콜백 요청입니다.");
        return;
      }

      const callbackKey = `${normalizedProvider}:${success}:${errorCode || ""}:${errorMessage || ""}`;
      if (consumedCallbackRef.current === callbackKey) {
        return;
      }
      consumedCallbackRef.current = callbackKey;

      try {
        setMessage("로그인 중이에요...");
        const tokens = await refreshSessionApi();
        setAuthTokens({ accessToken: tokens?.accessToken });

        const user = await getMyInfoApi();

        if (!active) {
          return;
        }

        setAuthState({
          user,
          isAuthenticated: true,
          loading: false,
        });
        navigate("/", { replace: true });
      } catch (callbackError) {
        if (!active) {
          return;
        }

        consumedCallbackRef.current = null;
        setError(
          callbackError?.message ||
            `${providerConfig.label} 로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.`,
        );
      }
    }

    completeLogin();

    return () => {
      active = false;
    };
  }, [
    errorCode,
    errorMessage,
    navigate,
    normalizedProvider,
    providerConfig.label,
    success,
  ]);

  const invalidCallback = success !== "true" && success !== "false";

  if (invalidCallback) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#38274c]">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-[0_24px_70px_rgba(93,63,211,0.12)]">
          <h1 className="text-2xl font-black tracking-tight">
            잘못된 OAuth 콜백 요청
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            OAuth 콜백에 필요한 정보가 없습니다.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-violet-700 px-6 text-sm font-semibold text-white"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#38274c]">
      <div className="w-full rounded-[2rem] bg-white p-8 shadow-[0_24px_70px_rgba(93,63,211,0.12)]">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-black ${providerConfig.accentClass}`}
        >
          {providerConfig.mark}
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-black tracking-tight">
              {providerConfig.label} 인증에 실패했어요
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-violet-700 px-6 text-sm font-semibold text-white"
            >
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black tracking-tight">
              {providerConfig.label} 로그인 처리 중
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
