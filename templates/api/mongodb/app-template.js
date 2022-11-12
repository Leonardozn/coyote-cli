function content(config) {
    const hasModels = Object.keys(config.models).length ? true : false

    let template = `const loadders = require('./src/loadders')
const getRouter = require('./src/routes/routes')
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')\n`

    if (config.authenticationApp) template += `const session = require('./src/middlewares/session')\n`
    if (config.authType && config.authType == 'cookies') template += `const cookieParser = require('cookie-parser')\n`
    if (hasModels) template += `const mongoHelper = require('./src/helpers/mongodb')\n`

    if (config.authType && config.authType == 'cookies') {
        template += `const config = require('./src/config/app')

const whiteList = [config.URL_ORIGIN_DEV]

app.use(cors({ origin: whiteList, credentials: true }))

app.use(cookieParser())\n\n`
    } else {
        template += `\napp.use(cors())\n\n`
    }

    template += `app.use(morgan('dev'))

app.use(express.json({ limit: '10mb' }))\n`

    if (config.authenticationApp) {
        template += `\napp.use('/', session, getRouter(), mongoHelper.closeConnection)\n`
    } else {
        template += `\napp.use('/', getRouter()${hasModels ? ', mongoHelper.closeConnection' : ''})\n`
    }

    template += `\n//Handler error
app.use((err, req, res, next) => {
    res.status(err.status).send(err.body)
})

module.exports = app
    `

    return template
}

module.exports = content