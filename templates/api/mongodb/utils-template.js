function content(auth) {
    let template = `const mongoose = require('mongoose')\n`

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
    }

    template += `function closeConnection(req, res, next) {
    mongoose.disconnect()
    next()
}

function errorMessage(err) {
    let error = {
        status: err.status || 500,
        message: err.message || 'Error interno del servicio, por favor comuniquese con el administrador'
    }
    
    return error
}

function apiError(status, message) {
    this.name = 'Api error'
    this.status = status
    this.message = message
}

apiError.prototype = Error.prototype

function getLocalDate() {
    const date = new Date()
    const localDate = \`\${date.getFullYear()}-\${date.getMonth()+1}-\${date.getDate()} \${date.getHours()}:\${date.getMinutes()}:\${date.getSeconds()} UTC\`
    
    return new Date(localDate)
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

function buildJsonQuery(key, obj, schema) {
    let query = {}

    Object.keys(obj).forEach(attr => {
        if (schema[key].obj_structure[attr].type == 'String') {
            query[\`\${key}.\${attr}\`] = { $regex: new RegExp(obj[attr], 'i') }
        } else {
            query[key] = obj[attr]
        }
    })
    
    return query
}

function objectKeyValues(key, keyValues, obj, schema) {
    let value = ''
    
    Object.keys(obj).forEach(attr => {
        if (schema[key].obj_structure[attr].type == 'String') {
            value = new RegExp(obj[attr], 'i')
        } else {
            value = obj[attr]
        }

        if (!keyValues[attr]) {
            keyValues[attr] = [value]
        } else {
            keyValues[attr].push(value)
        }
    })

    return keyValues
}

module.exports = {\n`

    if (auth) {
        template += `    encryptPwd,
    verifyPwd,\n`
    }

    template += `    errorMessage,
    closeConnection,
    errorMessage,
    apiError,
    getLocalDate,
    buildJsonQuery,
    objectKeyValues
}`

    return template
}

module.exports = content