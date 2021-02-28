function content() {
    const template = `const dotenv = require('dotenv')
dotenv.config()
const getRouter = require('./src/routes/routes')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const utils = require('./src/controllers/utils')

app.use(cors())

app.use(morgan('dev'))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.use('/', getRouter(), utils.closeConnection)

//Not found error
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