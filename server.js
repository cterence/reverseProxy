require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const http = require("http");
const https = require("https");

const { routes } = require("./config.json");
const certificate = fs.readFileSync(process.env.FULLCHAIN, "utf-8");
const privateKey = fs.readFileSync(process.env.PRIVKEY, "utf-8");
const credentials = { key: privateKey, cert: certificate };

const app = express();

app.use((req, res, next) => {
    if (req.secure) next();
    else res.redirect("https://" + req.headers.host + req.url);
});

app.set("view engine", "ejs");

for (route of routes) {
    app.use(
        route.route,
        createProxyMiddleware({
            target: route.address,
            pathRewrite: (path, req) => {
                return path.split("/").slice(2).join("/");
            },
            logLevel: "debug",
        })
    );
}

app.get("/", (req, res) => {
    if (req.headers.referer)
        // When a Node app redirects to "/" from "/foo/bar/baz/", redirect to "/foo/"
        res.redirect(req.headers.referer.split("/").slice(0, 4).join("/").concat("/"));
    else
        res.render("index", {
            routes,
            url: req.protocol + "://" + req.hostname,
        });
});

http.createServer(app).listen(80);
https.createServer(credentials, app).listen(443);
