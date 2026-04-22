let accessToken = null;
let refreshToken = null;

export const setAuthTokens = ({ access_token, refresh_token, token }) => {
  accessToken = access_token || token || null;
  refreshToken = refresh_token || null;
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearAuthTokens = () => {
  accessToken = null;
  refreshToken = null;
};

