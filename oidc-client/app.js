/**
 * Entry point of the service provider(FS) demo app.
 */
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')

const passport = require('passport');
const { Strategy } = require('passport-openidconnect');


var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();

const {
  oidcLoginAuthorize,
  oidcLogin,
} = require('./controllers/oidcAuthController');

const app = express();


// Note this enable to store user session in memory
// As a consequence, restarting the node process will wipe all sessions data
app.use(session({
  secret: 'a9d473f1fb7a1e2b34e87b07f59eeb3fc96273eff2ed2e781651044453e45300',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

// app.get('/', (req, res) => res.render('home', {
//   user: req.session.user
// }));

// app.get('/logout-callback', localLogout);
// 获取授权url
app.post('/auth/login-authorize', oidcLoginAuthorize)
// app.get('/auth/login-callback', oidcLoginCallback)

// 授权后调用接口获取用户信息
app.post('/auth/login', oidcLogin)

const jwt = require('jsonwebtoken');
const secretKey = 'QVcK2FGy3sfjFkRJJP8xuA';
// jwt_secret: a9d473f1fb7a1e2b34e87b07f59eeb3fc96273eff2ed2e781651044453e45300

config = require('./config');

const oidcConfig = {
  issuer: config.FI_URL,
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  authorizationURL: `${config.FI_URL}/oauth/v2/authorize`,
  tokenURL: `${config.FI_URL}/oauth/v2/token`,
  userInfoURL: `${config.FI_URL}/oidc/v1/userinfo`,
  callbackURL: `${config.FS_URL}/auth/oidc.callback`
};

passport.use('oidc', new Strategy(oidcConfig, (accessToken, refreshToken, profile, done) => {
  // You can handle the user profile here
  console.log(accessToken)
  console.log( refreshToken)
  console.log(profile)
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  console.log(user)
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.get('/auth/oidc', passport.authenticate('oidc'));
app.get('/auth/oidc.callback', passport.authenticate('oidc', { failureRedirect: '/' }), (req, res) => {
  // Successful authentication, redirect to secure route or do something else
  // console.log('res, ', res)
  // res
  //   .status(201)
  //   .cookie('access_token', 'Bearer ' + token, {
  //     expires: new Date(Date.now() + 8 * 3600000) // cookie will be removed after 8 hours
  //   })
  //   .cookie('test', 'test')
  //   .redirect(301, '/admin')
  res.redirect('/');
});

app.post('/api/auth.info', ensureAuthenticated, (req, res) => {
  // console.log(req)
  res.json({ message: `Hello, ` })
})

function ensureAuthenticated(req, res, next) {
  console.log(req.isAuthenticated())
  if (req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(403)
}

app.all("/*", function(req, res) {
  apiProxy.web(req, res, {
    target: 'http://localhost:8080/'
  });
});

// Setting app port
const port = process.env.PORT || '3000';

app.listen(port, () => {
  console.log(`\x1b[32mServer listening on http://localhost:${port}\x1b[0m`);
});
