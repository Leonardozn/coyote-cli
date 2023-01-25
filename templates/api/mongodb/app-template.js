function content(settings) {
    const hasModels = Object.keys(settings.models).length ? true : false

    let template = `const loadders = require('./src/loadders')
const getRouter = require('./src/routes/routes')
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const config = require('./src/config/app')\n`

    if (settings.authenticationApp) template += `const session = require('./src/middlewares/session')\n`
    if (settings.authType && settings.authType == 'cookies') template += `const cookieParser = require('cookie-parser')\n`
    if (hasModels) template += `const mongoHelper = require('./src/helpers/mongodb')\n`

    if (settings.authType && settings.authType == 'cookies') {
        template += `const whiteList = [config.URL_ORIGIN_DEV]

app.use(cors({ origin: whiteList, credentials: true }))

app.use(cookieParser())\n\n`
    } else {
        template += `\napp.use(cors())\n\n`
    }

    template += `app.use(morgan('dev'))

app.use(express.json({ limit: '10mb' }))\n`

    if (settings.authenticationApp) {
        template += `\napp.use(config.MAIN_PATH, session, getRouter(), mongoHelper.closeConnection)\n`
    } else {
        template += `\napp.use(config.MAIN_PATH, getRouter()${hasModels ? ', mongoHelper.closeConnection' : ''})\n`
    }

    template += `\n//Handler error
app.use((err, req, res, next) => {
\tres.status(err.status).json(err)
})

module.exports = app`

    return template
}

module.exports = content