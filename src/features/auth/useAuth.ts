import { useEffect, useSyncExternalStore } from "react";
import { getMyInfoApi, loginApi, logoutApi } from "./authApi";
import {
  clearAuthState,
  getAuthState,
  setAuthState,
  setAuthTokens,
  subscribeAuthStore,
  type AuthUser,
} from "./authStore";

type LoginCredentials = {
  email: string;
  password: string;
};

type AuthData = {
  accessToken?: string | null;
};

let initializePromise: Promise<AuthUser> | null = null;

async function initializeAuth(): Promise<AuthUser> {
  const currentState = getAuthState();
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  if (!hasAccessToken) {
    if (currentState.loading) {
      setAuthState({ loading: false });
    }
    return null;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const user = (await getMyInfoApi()) as AuthUser;

      setAuthState({
        user,
        isAuthenticated: true,
        loading: false,
      });

      return user;
    } catch (error) {
      clearAuthState();
      throw error;
    } finally {
      initializePromise = null;
    }
  })();

  return initializePromise;
}

async function login({ email, password }: LoginCredentials): Promise<AuthUser> {
  setAuthState((prev) => ({ ...prev, loading: true }));

  try {
    const authData = (await loginApi({ email, password })) as AuthData | null;

    setAuthTokens({
      accessToken: authData?.accessToken,
    });

    const user = (await getMyInfoApi()) as AuthUser;

    setAuthState({
      user,
      isAuthenticated: true,
      loading: false,
    });

    return user;
  } catch (error) {
    clearAuthState();
    throw error;
  }
}

async function refreshUser(): Promise<AuthUser> {
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  if (!hasAccessToken) {
    clearAuthState();
    return null;
  }

  setAuthState((prev) => ({ ...prev, loading: true }));

  try {
    const user = (await getMyInfoApi()) as AuthUser;

    setAuthState({
      user,
      isAuthenticated: true,
      loading: false,
    });

    return user;
  } catch (error) {
    clearAuthState();
    throw error;
  }
}

async function logout() {
  try {
    await logoutApi();
  } finally {
    clearAuthState();
  }
}

function useAuth() {
  const authState = useSyncExternalStore(
    subscribeAuthStore,
    getAuthState,
  );

  useEffect(() => {
    const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

    if (hasAccessToken && !authState.user && !authState.loading) {
      initializeAuth().catch(() => {});
    }
  }, [authState.loading, authState.user]);

  return {
    ...authState,
    initializeAuth,
    login,
    logout,
    refreshUser,
  };
}

export { useAuth };
