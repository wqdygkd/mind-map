import express from 'express'
import bodyParser from 'body-parser'
import httpProxy from 'http-proxy'
import { oauthAuthorizationUrl} from '@octokit/oauth-authorization-url'
import { createOAuthUserAuth } from '@octokit/auth-oauth-user'

const dotenv = await import('dotenv')
dotenv.default.config()

console.log(process.env.GITHUB_CLIENT_ID)

import tough from 'tough-cookie'
var Cookie = tough.Cookie;


const apiProxy = httpProxy.createProxyServer()
const routers = express.Router()
const app = express()

// app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

routers.get('/oauth/github', async (request, response) => {
  console.log(request.re)
  const { url, state } = oauthAuthorizationUrl({
    clientType: 'github-app',
    clientId: process.env.GITHUB_CLIENT_ID,
    redirectUrl: 'http://localhost:3000/oauth/github.callback'
    // login: "octocat",
    // state: "secret123",
  })
  console.log(url, state)
  response.cookie('state', state).redirect(302, url)
})


routers.get('/oauth/github.callback', async (request, response) => {
  const { code, state } = request.query
  console.log(request) // 包含域名
  var cookie = Cookie.parse(request.header)
  console.log(cookie) //
  // console.log(request.cookies.state) // 包含域名
  console.log(code)

  const auth = createOAuthUserAuth({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    clientType: 'github-app',
    code,
    state
  })
  // resolves once the user entered the `user_code` on `verification_uri`
  const { token } = await auth()
  console.log(token)
  // try {
  //   const api = (await import('./github/index.js')).default
  //   response.json(await api(code))
  // } catch (error_) {
  //   console.log(error_)
  //   response.status(404).send()
  // }

  response.cookie('accessToken', token).redirect(302, 'https://localhost:8087/admin')
})

// routers.all('/*', function(req, res) {
//   apiProxy.web(req, res, {
//     target: 'http://localhost:8080/'
//   })
// })

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
