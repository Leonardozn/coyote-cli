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
        message: err.message || 'Internal service error, please contact the administrator.'
    }
    
    return error
}

function apiError(status, message) {
    this.name = 'Api error'
    this.status = status
    this.message = message
}

apiError.prototype = Error.prototype

function getLocalDate(value) {
    let date = null
    if (value) {
        date = new Date(value)
    } else {
        date = new Date()
    }
    
    const localDate = \`\${date.getFullYear()}-\${date.getMonth()+1}-\${date.getDate()} \${date.getHours()}:\${date.getMinutes()}:\${date.getSeconds()} UTC\`
    
    return new Date(localDate)
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

function isObject(val) {
    if (val === null) return false
    if (Array.isArray(val)) return false
    if (typeof val == 'object') return true
    return false
}

function buildQuery(obj, attr, query, type) {
    Object.keys(obj).forEach((key, i) => {
        if (isObject(obj[key])) {
            attr += \`.\${key}\`
            attr = buildQuery(obj[key], attr, query, type)
        } else {
            attr += \`.\${key}\`
            attr = attr.replace('.', '')
            if (type == 'aggregate') {
                query.$match[attr] = obj[key]
                if (Array.isArray(obj[key])) query.$match[attr] = { $in: obj[key] }
            } else {
                query[attr] = obj[key]
                if (Array.isArray(obj[key])) query[attr] = { $in: obj[key] }
            }
            
            if (i == Object.keys(obj).length-1) {
                for (let i=0; i<2; i++) {
                    attr = attr.split('.')
                    attr.pop()
                    attr = attr.join('.')
                }
            } else {
                attr = attr.split('.')
                attr.pop()
                attr = attr.join('.')
            }
            
        }
    })
    
    return attr
}

function buildJsonQuery(obj, type) {
    let attr = ''
    let query = {}
    if (type == 'aggregate') query = { $match: {} }
    buildQuery(obj, attr, query, type)
    
    return query
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
    buildJsonQuery
}`

    return template
}

module.exports = content