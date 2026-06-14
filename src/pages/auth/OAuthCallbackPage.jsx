import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  fetchOAuthResultApi,
  getMyInfoApi,
} from "../../features/auth/authApi";
import {
  clearPendingOAuthLink,
  setPendingOAuthLink,
} from "../../features/auth/kakaoLinkStorage";
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
  return PROVIDER_CONFIG[provider] || {
    label: provider,
    accentClass: "bg-blue-100 text-blue-700",
    mark: provider.slice(0, 1),
  };
}

export default function OAuthCallbackPage({ provider = "KAKAO" }) {
  const normalizedProvider = String(provider || "KAKAO").toUpperCase();
  const providerConfig = useMemo(
    () => getProviderConfig(normalizedProvider),
    [normalizedProvider],
  );
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const resultKey = searchParams.get("resultKey");
  const flow = searchParams.get("flow") || "login";

  const isLinkFlow = flow === "link";
  const consumedResultKeyRef = useRef(null);
  const [message, setMessage] = useState(
    isLinkFlow
      ? `${providerConfig.label} 계정을 연결하고 있어요...`
      : `${providerConfig.label} 로그인 정보를 확인하고 있어요...`,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resultKey) {
      return;
    }

    if (consumedResultKeyRef.current === resultKey) {
      return;
    }

    consumedResultKeyRef.current = resultKey;

    let active = true;

    async function handleCallback() {
      try {
        const result = await fetchOAuthResultApi({
          provider: normalizedProvider,
          resultKey,
        });

        if (!active) {
          return;
        }

        if (result?.status === "SUCCESS") {
          if (isLinkFlow) {
            clearPendingOAuthLink();
            navigate(`/me/external-accounts?oauthLinked=${normalizedProvider}`, {
              replace: true,
            });
            return;
          }

          setMessage("로그인 중이에요...");
          setAuthTokens({
            accessToken: result.accessToken,
          });
          const user = await getMyInfoApi();

          if (!active) {
            return;
          }

          clearPendingOAuthLink();
          setAuthState({
            user,
            isAuthenticated: true,
            loading: false,
          });
          navigate("/", { replace: true });
          return;
        }

        if (result?.status === "LINK_REQUIRED") {
          if (isLinkFlow) {
            navigate(
              "/me/external-accounts?oauthError=" +
                encodeURIComponent(
                  "현재 로그인한 계정에 바로 연동할 수 없습니다.",
                ),
              { replace: true },
            );
            return;
          }

          setPendingOAuthLink({
            linkToken: result.linkToken,
            provider: result.provider || normalizedProvider,
            providerUserId: result.providerUserId,
            email: result.email,
            nickname: result.nickname,
          });
          navigate("/auth/oauth/link-required", { replace: true });
          return;
        }

        const errorMessage =
          result?.errorMessage ||
          `${providerConfig.label} 인증 처리에 실패했습니다.`;

        if (isLinkFlow) {
          navigate(
            `/me/external-accounts?oauthError=${encodeURIComponent(errorMessage)}`,
            {
              replace: true,
            },
          );
          return;
        }

        setError(errorMessage);
      } catch (callbackError) {
        if (!active) {
          return;
        }

        consumedResultKeyRef.current = null;

        const errorMessage =
          callbackError?.message ||
          `${providerConfig.label} 인증 처리에 실패했습니다.`;
        if (isLinkFlow) {
          navigate(
            `/me/external-accounts?oauthError=${encodeURIComponent(errorMessage)}`,
            {
              replace: true,
            },
          );
          return;
        }

        setError(errorMessage);
      }
    }

    handleCallback();

    return () => {
      active = false;
    };
  }, [
    isLinkFlow,
    navigate,
    normalizedProvider,
    providerConfig.label,
    resultKey,
  ]);

  if (!resultKey) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#38274c]">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-[0_24px_70px_rgba(93,63,211,0.12)]">
          <h1 className="text-2xl font-black tracking-tight">
            잘못된 콜백 요청
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            OAuth 결과 키가 없습니다.
          </p>
          <Link
            to={isLinkFlow ? "/me/external-accounts" : "/login"}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-violet-700 px-6 text-sm font-semibold text-white"
          >
            {isLinkFlow ? "외부 계정 관리로 돌아가기" : "로그인으로 돌아가기"}
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
              {isLinkFlow
                ? `${providerConfig.label} 계정을 연결하고 있어요`
                : `${providerConfig.label} 로그인 처리 중`}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
