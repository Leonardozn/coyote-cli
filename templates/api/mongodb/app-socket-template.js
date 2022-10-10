function content(config, authType) {
    let template = `const loadders = require('./src/loadders')
const getRouter = require('./src/routes/routes')
const express = require('express')
const app = express()
const cors = require('cors')\n`

    if (config.authenticationApp) template += `const session = require('./src/middlewares/session')\n`

    template += `const mongoHelper = require('./src/helpers/mongodb')
const config = require('./src/config/app')
const { Server } = require('socket.io')
const http = require('http')
const server = http.createServer(app)\n\n`

    if (authType && authType == 'cookies') {
        template += `const whiteList = [config.URL_ORIGIN_DEV]

app.use(cors({ origin: whiteList, credentials: true }))

app.use(cookieParser())\n\n`
    } else {
        template += `const io = new Server(server, { cors: {} })\n`
    }

    if (config.authenticationApp) {
        template += `\napp.use('/', session, getRouter(), mongoHelper.closeConnection)\n`
    } else {
        template += `\nio.on('connection', (socket) => { getRouter(io, socket) })\n`
    }

    template += `\nmodule.exports = server`

    return template
}

module.exports = content