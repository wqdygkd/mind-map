import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import httpProxy from 'http-proxy'
import { oauthAuthorizationUrl} from '@octokit/oauth-authorization-url'
import { createOAuthUserAuth } from '@octokit/auth-oauth-user'

const dotenv = await import('dotenv')
dotenv.default.config()

const apiProxy = httpProxy.createProxyServer()
const routers = express.Router()
const app = express()

// app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

routers.get('/oauth/github', async (request, response) => {
  console.log(request.headers.referer)
  let redirectBaseUrl = request.headers.referer || ''
  const { url, state } = oauthAuthorizationUrl({
    clientType: 'github-app',
    clientId: process.env.GITHUB_CLIENT_ID,
    redirectUrl: `${redirectBaseUrl}oauth/github.callback`
    // login: "octocat",
    // state: "secret123",
  })
  response.cookie('state', `${redirectBaseUrl}|${state}`).redirect(302, url)
})

routers.get('/oauth/github.callback', async (request, response) => {
  try {
    const { code, state } = request.query

    console.log(request.cookies) // 包含域名
    let cookies = request.cookies
    let [redirectBaseUrl, cookieState ] = (cookies.state || '').split('|')
    const auth = createOAuthUserAuth({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      clientType: 'github-app',
      code,
      state
      // expiresAt: '',
      // refreshTokenExpiresAt: ''
    })
    const { token, refreshToken,  } = await auth()

    response.cookie('accessToken', token).redirect(302, redirectBaseUrl)
  } catch(err) {
    console.log(err)
    response.status(500).send(err)
  }
})

routers.all('/*', function(req, res) {
  apiProxy.web(req, res, {
    target: 'http://localhost:8080/'
  })
})

app.use('/', routers)

app.all("/*", function(req, res) {
  apiProxy.web(req, res, {
    target: 'http://localhost:8080/'
  })
})

const port = process.env.PORT || '3000'

app.listen(port, () => {
  console.log(`\x1b[32mServer listening on http://localhost:${port}\x1b[0m`)
})
