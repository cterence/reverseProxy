require('dotenv').config()

const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const fs = require('fs')
const https = require('https')

const { routes } = require('./config.json')
const certificate = fs.readFileSync(process.env.FULLCHAIN, 'utf-8')
const privateKey = fs.readFileSync(process.env.PRIVKEY, 'utf-8')
const credentials = { key: privateKey, cert: certificate }

const app = express()

for (route of routes) {
    app.use(
        route.route,
        createProxyMiddleware({
            target: route.address,
            pathRewrite: (path, req) => {
                return path.split('/').slice(2).join('/')
            },
        })
    )
}

app.get('/', (req, res) => {
    if (req.headers.referer) res.redirect(req.headers.referer)
    else res.sendStatus(404)
})

const httpsServer = https.createServer(credentials, app)
httpsServer.listen(443)
