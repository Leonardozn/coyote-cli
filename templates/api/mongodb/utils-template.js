function content(auth) {
    let template = `const mongoose = require('mongoose')
\n`

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

function buildOperatorsQuery(obj, query) {
    let operators = ['sum','avg']
    let pipelines = ['gt','gte','lt','lte','eq','ne']

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
            let exist = false
            let group = null
            for (let operator of operators) {
                if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].group) {
                    exist = true

                    if (Array.isArray(obj[key])) {
                        if (!group) group = { $group: { _id: {} } }
                        for (let field of obj[key]) group.$group._id[field] = \`$\${field}\`
                    } else {
                        if (!group) group = { $group: { _id: \`$\${obj[key]}\` } }
                    }

                    if (obj[operator].group.alias && obj[operator].group.field) {
                        if (Array.isArray(obj[operator].group.alias) && Array.isArray(obj[operator].group.field)) {
                            if (obj[operator].group.alias.length == obj[operator].group.field.length) {
                                for (let i=0; i<obj[operator].group.alias.length; i++) {
                                    if (isNaN(obj[operator].group.field[i])) group.$group[obj[operator].group.alias[i]] = { [\`$\${operator}\`]: \`$\${obj[operator].group.field[i]}\` }
                                    if (!isNaN(obj[operator].group.field[i])) group.$group[obj[operator].group.alias[i]] = { [\`$\${operator}\`]: parseFloat(obj[operator].group.field[i]) }
                                }
                            } else {
                                throw new apiError(400, \`The '\${operator}' operator for 'group' is not properly defined, this must be an object with the keys 'alias' and 'field' and must contain the same number of values.\`)
                            }
                        } else {
                            if (typeof obj[operator].group.alias != 'object' && typeof obj[operator].group.field != 'object') {
                                if (isNaN(obj[operator].group.field)) group.$group[obj[operator].group.alias] = { [\`$\${operator}\`]: \`$\${obj[operator].group.field}\` }
                                if (!isNaN(obj[operator].group.field)) group.$group[obj[operator].group.alias] = { [\`$\${operator}\`]: parseFloat(obj[operator].group.field) }
                            } else {
                                throw new apiError(400, \`The '\${operator}' operator for 'group' is not properly defined, please check the values.\`)
                            }
                        }
                    } else {
                        throw new apiError(400, \`The '\${operator}' operator for 'group' is not properly defined, this must be an object with the keys 'alias' and 'field'.\`)
                    }
                }
            }

            query.push(group)
            
            if (!exist) throw new apiError(400, 'The group operator must be combined with a sub operator such as sum or avg.')
        }

        if (key == 'projects') {
            let projects = { $project: { _id: 0 } }

            if (Array.isArray(obj.projects)) {
                for (let field of obj.projects) projects.$project[field] = 1
            } else {
                projects.$project[obj.projects] = 1
            }
            
            for (let operator of operators) {
                if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].project) {
                    if (obj[operator].project.alias && obj[operator].project.field) {
                        if (Array.isArray(obj[operator].project.alias) && Array.isArray(obj[operator].project.field)) {
                            if (obj[operator].project.alias.length == obj[operator].project.field.length) {
                                for (let i=0; i<obj[operator].project.alias.length; i++) projects.$project[obj[operator].project.alias[i]] = \`$\${obj[operator].project.field[i]}\`
                            } else{
                                throw new apiError(400, \`The '\${operator}' operator for 'project' is not properly defined, this must be an object with the keys 'alias' and 'field' and must contain the same number of values.\`)
                            }
                        } else {
                            if (typeof obj[operator].project.alias != 'object' && typeof obj[operator].project.field != 'object') {
                                projects.$project[obj[operator].project.alias] = \`$\${obj[operator].project.field}\`
                            } else {
                                throw new apiError(400, \`The '\${operator}' operator for 'project' is not properly defined, please check the values.\`)
                            }
                        }
                    } else {
                        throw new apiError(400, \`The '\${operator}' operator for 'project' is not properly defined, this must be an object with the keys 'alias' and 'field'.\`)
                    }
                }
            }

            query.push(projects)
        }

        if (pipelines.indexOf(key) > -1) {
            let projects = null
            const index = query.findIndex(item => item.$project)
            if (index == -1) {
                projects = { $project: virtuals.product }
            } else {
                projects = query[index]
            }

            for (let pipeline of pipelines) {
                if (pipeline == key) {
                    if (obj[key].alias && obj[key].field && obj[key].value) {
                        if (typeof obj[key].alias != 'object' && typeof obj[key].field != 'object' && typeof obj[key].value != 'object') {
                            projects.$project[obj[key].alias] = { [\`$\${key}\`]: [\`$\${obj[key].field}\`, parseFloat(obj[key].value)] }
                        } else {
                            throw new apiError(400, \`The '\${key}' operator is not properly defined, please check the values.\`)
                        }
                    } else {
                        throw new apiError(400, \`The '\${key}' operator is not properly defined, this must be an object with the keys 'alias', 'field' and 'value.\`)
                    }
                }
            }

            query.push(projects)
        }

        if (key == 'sort') {
            let sort = { $sort: {} }

            if (obj.sort.field && obj.sort.value) {
                if (Array.isArray(obj.sort.field) && Array.isArray(obj.sort.value)) {
                    if (obj.sort.field.length == obj.sort.value.length) {
                        for (let i=0; i<obj.sort.field.length; i++) {
                            if (parseInt(obj.sort.value[i]) === -1 || parseInt(obj.sort.value[i]) === 1) {
                                sort.$sort[obj.sort.field[i]] = parseInt(obj.sort.value[i])
                            } else {
                                throw new apiError(400, \`The operator 'sort' only accept -1 or 1 as values.\`)
                            }
                        }
                    } else {
                        throw new apiError(400, \`The 'sort' is not properly defined, this must be an object with the keys 'alias' and 'field' and must contain the same number of values.\`)
                    }
                } else {
                    if (typeof obj.sort.field != 'object' && typeof obj.sort.value != 'object') {
                        if (parseInt(obj.sort.value) === -1 || parseInt(obj.sort.value) === 1) {
                            sort.$sort[obj.sort.field] = parseInt(obj.sort.value)
                        } else {
                            throw new apiError(400, \`The operator 'sort' only accept -1 or 1 as values.\`)
                        }
                    } else {
                        throw new apiError(400, \`The operator 'sort' is not properly defined, please check the values.\`)
                    }
                }
            } else {
                throw new apiError(400, \`The 'sort' operator is not properly defined, this must be an object with the keys field and value.\`)
            }

            query.push(sort)
        }
    })
}

function buildFieldsQuery(obj, attr, query, type, operators) {
    const keys = Object.keys(obj).filter(key => {
        if (operators.indexOf(key) == -1) return key
    })
    
    keys.forEach(key => {
        if (operators.indexOf(key) == -1) {
            if (type == 'aggregate') {
                if (isObject(obj[key])) {
                    obj[key].pattern = key
                    if (obj.pattern) {
                        attr = buildNestedAttr(obj, attr)
                        attr += \`.\${key}\`
                    } else {
                        attr = \`.\${key}\`
                    }
                    
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
                        attr += \`.\${key}\`
                    } else {
                        attr = \`.\${key}\`
                    }

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
    const keys = Object.keys(obj)
    
    if (keys.length > 0) {
        let attr = ''
        obj.pattern = ''
        const operators = ['pattern','gt','gte','lt','lte','eq','ne','between','notBetween','or','group','sum','avg','sort','projects']
        const operator = operators.find(item => keys.indexOf(item) > -1)

        if (type == 'aggregate') {
            query = [{ $match: {} }]
            const filters = Object.keys(obj).filter(key => {
                if (operators.indexOf(key) == -1) return key
            })
            
            buildFieldsQuery(obj, attr, query, type, operators)

            if (!filters.length) {
                const index = query.findIndex(item => item.$match)
                query[index].$match = { _id : {$ne: ""} }
            }

            if (operator) buildOperatorsQuery(obj, query, type)
        } else {
            buildFieldsQuery(obj, attr, query, type, operators)
        }
    } else {
        if (type == 'aggregate') query = [{ $match: { _id : {$ne: ""} } }]
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