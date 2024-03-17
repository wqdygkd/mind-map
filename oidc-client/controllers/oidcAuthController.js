const
  crypto = require('crypto'),
  request = require('async-request'),
  config = require('../config');

const oidcLoginAuthorize = (req, res) => {
  req.session.state = crypto.randomBytes(20).toString('hex');
  req.session.nonce = crypto.randomBytes(20).toString('hex');

  return res.send(`${config.AUTHORIZE_URL}?response_type=code`
  + `&client_id=${config.CLIENT_ID}`
  + `&redirect_uri=${config.LOGIN_CALLBACK_URL}`
  + `&scope=${config.SCOPES}`
  + `&state=${req.session.state}`)
  // return res.redirect(
  //   `${config.AUTHORIZE_URL}?response_type=code`
  //     + `&client_id=${config.CLIENT_ID}`
  //     + `&redirect_uri=${config.LOGIN_CALLBACK_URL}`
  //     + `&scope=${config.SCOPES}`
  //     + `&state=${req.session.state}`
  //     + `&nonce=${req.session.nonce}`
  // );
};

const oidcLoginCallback = async (req, res, next) => {
  // check if the mandatory Authorization code is there
  if (!req.query.code) {
    console.error('missing "code" parameter');
    return res.sendStatus(400);
  }

  // check if the mandatory state is there and has the good value
  if (!req.query.state || req.query.state !== req.session.state) {
    console.error('"state" mismatch');
    return res.sendStatus(400);
  }

  try {
    // Get Access Token
    const body = {
      grant_type: 'authorization_code',
      redirect_uri: config.LOGIN_CALLBACK_URL,
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      code: req.query.code,
    };

    // Request access token.
    const tokenResponse = await request(config.TOKEN_URL, {
        method: 'POST',
        data: body,
      });

    const { access_token: accessToken, id_token: idToken } = JSON.parse(tokenResponse.body);
    if (!accessToken || !idToken) {
      console.error('Access token or idToken missing in response');
      return res.sendStatus(401);
    }

    if (!isIdTokenValid(idToken, req)) {
      console.error('Invalid idToken');
      return res.sendStatus(401);
    }

    console.log('OIDC Token OK');
    console.log('idToken', idToken);
    console.log('accessToken', accessToken);

    // Request user data
    const userInfoResponse = await request(config.USERINFO_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userInfo = JSON.parse(userInfoResponse.body);

    console.log('OIDC USER', userInfo);

    const user = {
      uid: userInfo.sub,
      login: '## not-yet-implemented ##',
      lastName: userInfo.family_name,
      firstNames: userInfo.given_name,
      birthDate: userInfo.birthdate,
      email: userInfo.email,
      phone: userInfo.phone_number,
      address: userInfo.address && userInfo.address.street_address,
      postalCode: userInfo.address && userInfo.address.postal_code,
      city: userInfo.address && userInfo.address.locality,
      country: userInfo.address && userInfo.address.country
    };

    // Store the user in session so it is available for future requests
    // as the idToken for Logout, and the context
    req.session.user = user;
    req.session.idToken = idToken;

    return res.redirect('/');
  } catch (error) {
    console.error('LoginCallback ERROR', error);
    return next(error);
  }
};

const oidcLogin = async (req, res, next) => {
  if (!req.body.code) {
    console.error('missing "code" parameter');
    return res.status(400).send('missing "code" parameter')
  }

  if (!req.body.state) {
    console.error('"state" mismatch');
    return res.status(400).send('"state" mismatch')
  }

  try {
    // Get Access Token
    const body = {
      grant_type: 'authorization_code',
      redirect_uri: config.LOGIN_CALLBACK_URL,
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      code: req.body.code,
    };

    // Request access token.
    const tokenResponse = await request(config.TOKEN_URL, {
      method: 'POST',
      data: body,
    });

    const { access_token: accessToken, id_token: idToken } = JSON.parse(tokenResponse.body);
    console.log(tokenResponse.body)
    if (!accessToken || !idToken) {
      console.error('Access token or idToken missing in response');
      return res.status(401).send('Access token or idToken missing in response')
    }

    if (!isIdTokenValid(idToken, req)) {
      console.error('Invalid idToken');
      return res.sendStatus(401);
    }

    console.log('OIDC Token OK');
    console.log('idToken', idToken);
    console.log('accessToken', accessToken);

    // Request user data
    const userInfoResponse = await request(config.USERINFO_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userInfo = JSON.parse(userInfoResponse.body);

    console.log('OIDC USER', userInfo);

    const user = {
      uid: userInfo.sub,
      login: '## not-yet-implemented ##',
      lastName: userInfo.family_name,
      firstNames: userInfo.given_name,
      birthDate: userInfo.birthdate,
      email: userInfo.email,
      phone: userInfo.phone_number,
      address: userInfo.address && userInfo.address.street_address,
      postalCode: userInfo.address && userInfo.address.postal_code,
      city: userInfo.address && userInfo.address.locality,
      country: userInfo.address && userInfo.address.country
    };

    // Store the user in session so it is available for future requests
    // as the idToken for Logout, and the context
    req.session.user = user;
    req.session.idToken = idToken;
    return res.status(200).json({
      token: idToken,
      userInfo
    })
    // return res.redirect('/');
  } catch (error) {
    console.error('LoginCallback ERROR', error);
    return next(error);
  }
};

const oidcLogout = (req, res) => {
  const { session: { idToken } } = req;

  return res.redirect(
    `${config.LOGOUT_URL}?id_token_hint=${idToken}`
    + `&post_logout_redirect_uri=${config.LOGOUT_CALLBACK_URL}`
    + `&state=${req.session.state}`
  );
};

/*
idToken validation
@se https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
*/
const isIdTokenValid = (idToken, req) => {
  console.log('idToken (Base64)', idToken);

  const [header, data, signature] = idToken.split('.');
  if (!header || !data || !signature) {
    console.error('malformed idToken');
    return false;
  }

  try {
    const jwt = JSON.parse(new Buffer(data, 'base64').toString('utf-8'));
    console.log('idToken (JWT)', jwt);

    // The Issuer Identifier for the OpenID Provider (which is typically obtained during Discovery) MUST exactly match the value of the iss (issuer) Claim.
    if (jwt.iss !== config.FI_URL) {
      console.error('Bad issuer');
      return false;
    }

    // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience.
    // (...).
    // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
    const audiences = jwt.aud;
    if (! audiences.includes(config.CLIENT_ID)) {
      console.error('Bad audience');
      return false;
    }

    // The current time MUST be before the time represented by the exp Claim.
    if (jwt.exp * 1000 < Date.now()) {
      console.error('Token has expired');
      return false;
    }

    // If a nonce value was sent in the Authentication Request, a nonce Claim MUST be present
    // and its value checked to verify that it is the same value as the one that was sent in the Authentication Request
    // if (jwt.nonce != req.session.nonce) {
    //   console.error('"nonce" mismatch');
    //   return false;
    // }

    return true;
  }
  catch (err) {
    console.error(err);
    return false;
  }
};

module.exports = {
  oidcLoginAuthorize,
  oidcLoginCallback,
  oidcLogin,
  oidcLogout,
};
