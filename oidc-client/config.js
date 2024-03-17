const
  FI_URL = process.env.FI_URL || 'https://auth.wqdy.top',
  FS_URL = process.env.FS_URL || 'http://localhost:3000';

module.exports = {
  FI_URL,
  FS_URL,
  CLIENT_ID: process.env.CLIENT_ID || '258490992540319748@mind-map',
  CLIENT_SECRET: process.env.CLIENT_SECRET || 'EKuP5NOGkSlByIQZEsZOokrt31BYs1uBmqMRdxYDgftrKw3bObY7gjfeje8fJ4Mu',
  AUTHORIZE_URL: `${FI_URL}/oauth/v2/authorize`,
  TOKEN_URL: `${FI_URL}/oauth/v2/token`,
  USERINFO_URL: `${FI_URL}/oidc/v1/userinfo`,
  LOGOUT_URL: `${FI_URL}/oidc/v1/end_session`,
  LOGIN_CALLBACK_URL: `${FS_URL}/oidc.callback`,
  // LOGOUT_CALLBACK_URL: `${FS_URL}/logout-callback`,
  SCOPES: 'openid profile email phone address policy',
};
