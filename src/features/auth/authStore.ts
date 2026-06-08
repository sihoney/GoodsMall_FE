const ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";

type AuthUser = {
  id?: string;
  memberId?: string;
  role?: string;
  [key: string]: unknown;
} | null;

type AuthState = {
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
};

type AuthStateUpdater = AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>);
type AuthListener = () => void;

let authState: AuthState = {
  user: null,
  isAuthenticated: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)),
  loading: false,
};

const listeners = new Set<AuthListener>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const getAuthState = () => authState;

const subscribeAuthStore = (listener: AuthListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const setAuthState = (updater: AuthStateUpdater) => {
  const nextState = typeof updater === "function" ? updater(authState) : updater;
  authState = { ...authState, ...nextState };

  emitChange();
};

const setAuthTokens = ({ accessToken }: { accessToken?: string | null }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
};

const clearAuthState = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);

  authState = {
    user: null,
    isAuthenticated: false,
    loading: false,
  };

  emitChange();
};

export {
  ACCESS_TOKEN_KEY,
  clearAuthState,
  getAuthState,
  setAuthState,
  setAuthTokens,
  subscribeAuthStore,
};
export type { AuthState, AuthUser };
