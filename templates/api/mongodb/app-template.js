function content(config) {
    let template = `const dotenv = require('dotenv')
dotenv.config()
const getRouter = require('./src/routes/routes')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')\n`

    if (config.authenticationApp) template += `const session = require('./src/middlewares/session')\n`

    template += `const utils = require('./src/controllers/utils')

app.use(cors())

app.use(morgan('dev'))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())\n`

    if (config.authenticationApp) {
        template += `\napp.use('/', session, getRouter(), utils.closeConnection)\n`
    } else {
        template += `\napp.use('/', getRouter(), utils.closeConnection)\n`
    }

    template += `\n//Not found error
app.use((req, res, next) => {
    const err = new Error('Not found')
    err.status = 404
    next(err)
})

//Handler error
app.use((err, req, res, next) => {
    const error = utils.errorMessage(err)
    res.status(error.status).send({ status: error.status, message: error.message })
})

module.exports = app
    `

    return template
}

module.exports = content