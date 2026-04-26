const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

const safeStorageGet = (key) => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key, value) => {
  try {
    if (typeof window === "undefined") return;
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // non-blocking
  }
};

let accessToken = safeStorageGet(ACCESS_TOKEN_KEY);
let refreshToken = safeStorageGet(REFRESH_TOKEN_KEY);

export const setAuthTokens = ({ access_token, refresh_token, token }) => {
  accessToken = access_token || token || null;
  refreshToken = refresh_token || null;
  safeStorageSet(ACCESS_TOKEN_KEY, accessToken);
  safeStorageSet(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearAuthTokens = () => {
  accessToken = null;
  refreshToken = null;
  safeStorageSet(ACCESS_TOKEN_KEY, null);
  safeStorageSet(REFRESH_TOKEN_KEY, null);
};

