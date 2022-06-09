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

function buildAggregateQuery(obj, attr, query, level) {
    Object.keys(obj).forEach((key, i) => {
        if (key == 'virtuals') {
            if (query.findIndex(item => item.$project) == -1) {
                let virtuals = { $project: { _id: 0 } }
                if (Array.isArray(obj.virtuals)) {
                    for (let field of obj.virtuals) virtuals.$project[field] = 1
                } else {
                    virtuals.$project[obj.virtuals] = 1
                }

                query.push(virtuals)
            }
        } else {
            if (isObject(obj[key])) {
                level++
                attr += \`.\${key}\`
                attr = buildAggregateQuery(obj[key], attr, query, level)
            } else {
                if (level-1 == 0) attr = ''
                attr += \`.\${key}\`
                if (attr.indexOf('.') == 0) attr = attr.replace('.', '')
                for (let item of query) {
                    if (item.$match) {
                        item.$match[attr] = obj[key]
                        if (Array.isArray(obj[key])) item.$match[attr] = { $in: obj[key] }
                        break
                    }
                }
                
                if (i == Object.keys(obj).length-1) {
                    for (let j=0; j<level; j++) {
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
        }
    })
    
    return attr
}

function buildFindQuery(obj, attr, query, level) {
    Object.keys(obj).forEach((key, i) => {
        if (isObject(obj[key])) {
            level++
            attr += \`.\${key}\`
            attr = buildFindQuery(obj[key], attr, query, level)
        } else {
            if (level-1 == 0) attr = ''
            attr += \`.\${key}\`
            if (attr.indexOf('.') == 0) attr = attr.replace('.', '')
            query[attr] = obj[key]
            if (Array.isArray(obj[key])) query[attr] = { $in: obj[key] }
            
            if (i == Object.keys(obj).length-1) {
                for (let j=0; j<level; j++) {
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
    let level = 0
    if (type == 'aggregate') {
        query = [{ $match: {} }]
        buildAggregateQuery(obj, attr, query, level)
    } else {
        buildFindQuery(obj, attr, query, level)
    }
    
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