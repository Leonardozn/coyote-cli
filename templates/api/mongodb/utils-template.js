function content(auth) {
    let template = `const mongoose = require('mongoose')
const { validationResult } = require('express-validator')\n`

    if (auth) {
        template += `\nconst bcrypt = require('bcrypt')

function encryptPwd(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return reject({status: 500, message: err.message})
            return resolve(hash)
        })
    })
}

function verifyPwd(password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            if (err) return reject({status: 500, message: err.message})
            return resolve(result)
        })
    })
}\n\n`
    } else {
        template += '\n'
    }

    template += `function closeConnection(req, res, next) {
    mongoose.disconnect()
    next()
}

function buildError(error) {
    let obj = {
        status: error.status || 500,
        body: { errors: [] }
    }

    let err = {
        msg: error.message || 'Internal service error, please contact the administrator.'
    }
    
    // Unique constraint
    if (error.code && error.code == 11000) {
        const field = Object.keys(error.keyValue)[0]
        
        obj.status = 400
        err.value = error.keyValue[field]
        err.msg = 'Unique field.'
        err.param = field
        err.location = 'body'
    }

    obj.body.errors.push(err)

    return obj
}

const validationResultExpress = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    next()
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = {\n`

    if (auth) {
        template += `\tencryptPwd,
    verifyPwd,\n`
    }

    template += `\tcloseConnection,
    buildError,
    validationResultExpress
}`

    return template
}

module.exports = content