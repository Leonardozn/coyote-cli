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

function buildNestedAttr(obj, attr) {
    let fields = attr.split('.')
    if (!fields[0].length) fields.shift()
    attr = ''
    for (let field of fields) {
        attr += \`.\${field}\`
        if (field == obj.pattern) break 
    }
    return attr
}

function buildVirtuals(obj, query) {
    let virtuals = { $project: { _id: 0 } }
    if (Array.isArray(obj.virtuals)) {
        for (let field of obj.virtuals) virtuals.$project[field] = 1
    } else {
        virtuals.$project[obj.virtuals] = 1
    }

    let operators = ['sum']
    
    for (let operator of operators) {
        if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].project) {
            if (obj[operator].project.alias && obj[operator].project.field) {
                if (Array.isArray(obj[operator].project.alias) && Array.isArray(obj[operator].project.field)) {
                    if (obj[operator].project.alias.length == obj[operator].project.field.length) {
                        for (let i=0; i<obj[operator].project.alias.length; i++) virtuals.$project[obj[operator].project.alias[i]] = \`$\${obj[operator].project.field[i]}\`
                    } else{
                        throw new apiError(400, \`The '\${operator}' operator for 'project' is not properly defined, this must be an object with the keys 'alias' and 'field' and must contain the same number of values.\`)
                    }
                } else {
                    if (typeof obj[operator].project.alias != 'object' && typeof obj[operator].project.field != 'object') {
                        virtuals.$project[obj[operator].project.alias] = \`$\${obj[operator].project.field}\`
                    } else {
                        throw new apiError(400, \`The '\${operator}' operator for 'project' is not properly defined, please check the values.\`)
                    }
                }
            } else {
                throw new apiError(400, \`The '\${operator}' operator for 'project' is not properly defined, this must be an object with the keys 'alias' and 'field'.\`)
            }
        }
    }

    query.push(virtuals)
}

function buildOperatorsQuery(obj, query) {
    Object.keys(obj).forEach(key => {
        if (key == 'or') {
            if (Array.isArray(obj[key])) {
                const index = query.findIndex(item => item.$match)
                if (index > -1) {
                    query[index].$match.$or = []

                    for (let field of obj[key]) {
                        for (let attr in query[index].$match) {
                            if (attr == field) {
                                query[index].$match.$or.push({ [attr]: query[index].$match[attr] })
                                delete query[index].$match[attr]
                            }
                        }
                    }
                }
            }
        }

        if (key == 'group') {
            let operators = ['sum']
            let exist = false
            for (let operator of operators) {
                if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].group) {
                    exist = true
                    let group = null

                    if (Array.isArray(obj[key])) {
                        group = { $group: { _id: {} } }
                        for (let field of obj[key]) group.$group._id[field] = \`$\${field}\`
                        query.push(group)
                    } else {
                        group = { $group: { _id: \`$\${obj[key]}\` } }
                        query.push(group)
                    }

                    if (obj[operator].group.alias && obj[operator].group.field) {
                        if (Array.isArray(obj[operator].group.alias) && Array.isArray(obj[operator].group.field)) {
                            if (obj[operator].group.alias.length == obj[operator].group.field.length) {
                                for (let i=0; i<obj[operator].group.alias.length; i++) {
                                    if (isNaN(obj[operator].group.field[i])) group.$group[obj[operator].group.alias[i]] = { $sum: \`$\${obj[operator].group.field[i]}\` }
                                    if (!isNaN(obj[operator].group.field[i])) group.$group[obj[operator].group.alias[i]] = { $sum: parseFloat(obj[operator].group.field[i]) }
                                }
                            } else {
                                throw new apiError(400, \`The '\${operator}' operator for 'group' is not properly defined, this must be an object with the keys 'alias' and 'field' and must contain the same number of values.\`)
                            }
                        } else {
                            if (typeof obj[operator].group.alias != 'object' && typeof obj[operator].group.field != 'object') {
                                if (isNaN(obj[operator].group.field)) group.$group[obj[operator].group.alias] = { $sum: \`$\${obj[operator].group.field}\` }
                                if (!isNaN(obj[operator].group.field)) group.$group[obj[operator].group.alias] = { $sum: parseFloat(obj[operator].group.field) }
                            } else {
                                throw new apiError(400, \`The '\${operator}' operator for 'group' is not properly defined, please check the values.\`)
                            }
                        }
                    } else {
                        throw new apiError(400, \`The '\${operator}' operator for 'group' is not properly defined, this must be an object with the keys 'alias' and 'field'.\`)
                    }
                }
            }
            
            if (!exist) throw new apiError(400, 'The group operator must be combined with a sub operator such as sum or avg.')
        }
    })
}

function buildFieldsQuery(obj, attr, query, type, operators) {
    const keys = Object.keys(obj).filter(key => {
        if (operators.indexOf(key) == -1) return key
    })
    
    keys.forEach((key, i) => {
        if (operators.indexOf(key) == -1) {
            if (type == 'aggregate') {
                if (isObject(obj[key])) {
                    obj[key].pattern = key
                    if (obj.pattern) {
                        attr = buildNestedAttr(obj, attr)
                    } else {
                        attr = ''
                    }
                    
                    attr += \`.\${key}\`
                    attr = buildFieldsQuery(obj[key], attr, query, type, operators)
                } else {
                    if (obj.pattern) {
                        attr = buildNestedAttr(obj, attr)
                        attr += \`.\${key}\`
                    } else {
                        attr = \`.\${key}\`
                    }

                    if (attr.indexOf('.') == 0) attr = attr.replace('.', '')
                    for (let item of query) {
                        if (item.$match) {
                            item.$match[attr] = obj[key]
                            if (Array.isArray(obj[key])) item.$match[attr] = { $in: obj[key] }
                            break
                        }
                    }
                }
            } else {
                if (isObject(obj[key])) {
                    obj[key].pattern = key
                    if (obj.pattern) {
                        attr = buildNestedAttr(obj, attr)
                    } else {
                        attr = ''
                    }

                    attr += \`.\${key}\`
                    attr = buildFieldsQuery(obj[key], attr, query, type, operators)
                } else {
                    if (obj.pattern) {
                        attr = buildNestedAttr(obj, attr)
                        attr += \`.\${key}\`
                    } else {
                        attr = \`.\${key}\`
                    }
                    
                    if (attr.indexOf('.') == 0) attr = attr.replace('.', '')
                    query[attr] = obj[key]
                    if (Array.isArray(obj[key])) query[attr] = { $in: obj[key] }
                }
            }
        }
    })
    
    return attr
}

function buildJsonQuery(obj, type) {
    let query = {}
    
    if (Object.keys(obj).length > 0) {
        let attr = ''
        obj.pattern = ''
        const operators = ['pattern','gt','gte','lt','lte','eq','ne','between','notBetween','or','order','group','sum','sort','virtuals']
        
        if (type == 'aggregate') {
            query = [{ $match: {} }]
            buildFieldsQuery(obj, attr, query, type, operators)
            buildOperatorsQuery(obj, query, type)
            if (obj.virtuals) buildVirtuals(obj, query, type)
        } else {
            buildFieldsQuery(obj, attr, query, type, operators)
        }
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