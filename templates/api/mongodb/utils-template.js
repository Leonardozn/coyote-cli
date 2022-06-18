function content(auth) {
    let template = `const mongoose = require('mongoose')
const { DateTime } = require('luxon')\n`

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

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

function getOperators(type) {
    const generals = ['pattern','or','group','sort','projects','lookup']
    const arithmetic = ['sum','multiply','divide','avg','max','min']
    const accumulators = ['first','last']
    const logical = ['gt','gte','lt','lte','eq','ne']
    const accountants = ['limit','skip']
    
    if (type == 'generals') return generals
    if (type == 'arithmetic') return arithmetic
    if (type == 'accumulators') return accumulators
    if (type == 'logical') return logical
    if (type == 'accountants') return accountants

    return generals.concat(arithmetic, accumulators, logical, accountants)
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

function buildExpressionValue(value, result, operator, list, pattern) {
    if (isObject(value)) {
        Object.keys(value).forEach(key => {
            if (list.indexOf(key) > -1) {
                result = buildExpressionValue(value[key], result, key, list, false)
            }
        })
    } else if (Array.isArray(value)) {
        if (pattern) {
            if (result.findIndex(item => item[\`$\${operator}\`]) == -1) result.push({ [\`$\${operator}\`]: [] })
        } else {
            if (!result[\`$\${operator}\`]) result[\`$\${operator}\`] = []
        }

        for (let val of value) {
            if (isObject(val)) {
                Object.keys(val).forEach(field => {
                    if (list.indexOf(field) > -1) {
                        val = buildExpressionValue(val[field], result[\`$\${operator}\`], field, list, true)
                        result[\`$\${operator}\`] = val
                    }
                })
            } else if (!isNaN(val)) {
                if (pattern) {
                    result[result.findIndex(item => item[\`$\${operator}\`])][\`$\${operator}\`].push(parseFloat(val))
                } else {
                    result[\`$\${operator}\`].push(parseFloat(val))
                }
            } else {
                if (pattern) {
                    result[result.findIndex(item => item[\`$\${operator}\`])][\`$\${operator}\`].push(\`$\${val}\`)
                } else {
                    result[\`$\${operator}\`].push(\`$\${val}\`)
                }
            }
        }
    } else {
        if (!isNaN(value)) {
            if (pattern) {
                result[result.findIndex(item => item[\`$\${operator}\`])][\`$\${operator}\`] = parseFloat(value)
            } else {
                result[\`$\${operator}\`] = parseFloat(value)
            }
        } else {
            if (pattern) {
                result[result.findIndex(item => item[\`$\${operator}\`])][\`$\${operator}\`] = \`$\${value}\`
            } else {
                result[\`$\${operator}\`] = \`$\${value}\`
            }
        }
    }

    return result
}

function buildOperatorsQuery(obj, query, schema) {
    const arithmetic = getOperators('arithmetic')
    const accumulators = getOperators('accumulators')
    const logical = getOperators('logical')
    const accountants = getOperators('accountants')

    Object.keys(obj).forEach(key => {
        if (key == 'or') {
            if (isObject(obj[key])) {
                const index = query.findIndex(item => item.$match)
                query[index].$match[\`$\${key}\`] = []
                
                Object.keys(obj[key]).forEach(field => {
                    const logical_operator = Object.keys(obj[key][field]).filter(item => logical.indexOf(item) > -1)
                    
                    if (logical_operator.length) {
                        for (let operator of logical_operator) {
                            if (obj[key][field][operator] && typeof obj[key][field][operator] != 'object') {
                                if (index > -1) {
                                    let value = obj[key][field][operator]
            
                                    if (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
                                    if (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
                                    
                                    let position = query[index].$match[\`$\${key}\`].findIndex(item => item[field])
                                    
                                    if (position == -1) {
                                        query[index].$match[\`$\${key}\`].push({ [field]: { [\`$\${operator}\`]: value } })
                                    } else {
                                        query[index].$match[\`$\${key}\`][position][field][\`$\${operator}\`] = value
                                    }
    
                                    if (query[index].$match[field]) delete query[index].$match[field]
                                }
                            } else {
                                throw new apiError(400, \`The '\${operator}' logical operator for '\${key}' operator must be a sigle value.\`)
                            }
                        }
                    } else {
                        if (obj[key][field]) {
                            if (index > -1) {
                                if(Array.isArray(obj[key][field])) {
                                    for (let value of obj[key][field]) {
                                        if (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
                                        if (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
            
                                        query[index].$match[\`$\${key}\`].push({ [field]: value })
                                        if (query[index].$match[field]) delete query[index].$match[field]
                                    }
                                } else {
                                    let value = obj[key][field]
    
                                    if (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
                                    if (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
        
                                    query[index].$match[\`$\${key}\`].push({ [field]: value })
                                    if (query[index].$match[field]) delete query[index].$match[field]
                                }
                            } 
                        } else {
                            throw new apiError(400, \`The '\${key}' operator must have the 'value' key.\`)
                        }
                    }
                })
            } else {
                throw new apiError(400, \`The '\${key}' operator must be a object with the names of fields to change and its values. See the documentation.\`)
            }
        }

        if (key == 'group') {
            let exist = false
            let group = null

            if (Array.isArray(obj.group)) {
                if (!group) group = { $group: { _id: {} } }
                for (let field of obj.group) group.$group._id[field] = \`$\${field}\`
            } else {
                if (!group) group = { $group: { _id: \`$\${obj.group}\` } }
            }

            for (let operator of arithmetic) {
                if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].group) {
                    exist = true

                    if (isObject(obj[operator].group)) {
                        Object.keys(obj[operator].group).forEach(field => {
                            const val = buildExpressionValue(obj[operator].group[field], {}, operator, arithmetic, false)
                            if (Object.keys(val).some(item => item == \`$\${operator}\`)) {
                                group.$group[field] = val
                            } else {
                                group.$group[field] = { [\`$\${operator}\`]: val }
                            }
                        })
                    } else {
                        throw new apiError(\`The '\${operator}' operator must be an object with at least a group field.\`)
                    }
                }
            }

            if (!exist) throw new apiError(400, 'The group operator must be combined with a sub operator such as sum or avg.')
            
            query.push(group)
        }

        if (key == 'projects') {
            let projects = { $project: { _id: 0 } }
            
            if (Array.isArray(obj.projects)) {
                for (let field of obj.projects) projects.$project[field] = 1
            } else {
                projects.$project[obj.projects] = 1
            }
            
            for (let operator of arithmetic) {
                if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].project) {
                    if (isObject(obj[operator].project)) {
                        console.log(obj[operator].project)
                        Object.keys(obj[operator].project).forEach(field => {
                            const val = buildExpressionValue(obj[operator].project[field], {}, operator, arithmetic, false)
                            if (Object.keys(val).some(item => item == \`$\${operator}\`)) {
                                projects.$project[field] = val
                            } else {
                                projects.$project[field] = { [\`$\${operator}\`]: val }
                            }
                        })
                    } else {
                        throw new apiError(\`The '\${operator}' operator must be an object with at least a project field.\`)
                    }
                }
            }

            query.push(projects)
        }

        if (logical.indexOf(key) > -1) {
            const index = query.findIndex(item => item.$match)

            for (let operator of logical) {
                if (operator == key) {
                    if (obj[key].field && obj[key].value) {
                        if (typeof obj[key].field != 'object' && typeof obj[key].value != 'object') {
                            let value = null
                            
                            if (schema[obj[key].field] && schema[obj[key].field].type == 'Date') {
                                value = DateTime.fromISO(obj[key].value, { zone: 'utc' })
                            } else {
                                value = obj[key].value
                                if (!isNaN(obj[key].value)) value = parseFloat(obj[key].value)
                            }

                            if (query[index].$match[obj[key].field]) {
                                query[index].$match[obj[key].field][\`$\${key}\`] = value
                            } else {
                                query[index].$match[obj[key].field] = { [\`$\${key}\`]: value }
                            }
                        } else {
                            throw new apiError(400, \`The values of the keys of the '\${key}' operator must be of type string.\`)
                        }
                    } else {
                        throw new apiError(400, \`The '\${key}' operator is not properly defined, this must be an object with the keys 'field' and 'value.\`)
                    }
                }
            }
        }

        if (key == 'sort') {
            let sort = { $sort: {} }
            for (let field in obj.sort) {
                if (Array.isArray(obj.sort[field]) || (parseInt(obj.sort[field]) !== -1 && parseInt(obj.sort[field]) !== 1)) {
                    throw new apiError(400, \`The operator 'sort' only accept -1 or 1 as value on each field.\`)
                } else {
                    sort.$sort[field] = parseInt(obj.sort[field])
                }
            }

            query.push(sort)
        }

        if (key == 'lookup') {
            let lookup = { $lookup: {} }

            if (obj[key].from && obj[key].localField && obj[key].foreignField && obj[key].as) {
                if (typeof obj[key].from == 'string' && typeof obj[key].localField == 'string' && typeof obj[key].foreignField == 'string' && typeof obj[key].as == 'string') {
                    lookup.$lookup.from = obj[key].from
                    lookup.$lookup.localField = obj[key].localField
                    lookup.$lookup.foreignField = obj[key].foreignField
                    lookup.$lookup.as = obj[key].as
                } else {
                    throw new apiError(400, \`The keys 'from', 'localField', 'foreignField' and 'as' must be of type string\`)
                }
            } else {
                throw new apiError(400, \`The operator '\${key}' must have the keys 'from', 'localField', 'foreignField' and 'as' at least\`)
            }

            query.push(lookup)
        }

        if (accountants.indexOf(key) > -1) {
            if (!isNaN(obj[key])) {
                let index = query.findIndex(item => item[\`$\${key}\`])
                if (index > -1) {
                    query[index][\`$\${key}\`] = parseInt(obj[key])
                } else {
                    query.push({ [\`$\${key}\`]: parseInt(obj[key]) })
                }
            } else {
                throw new apiError(400, \`The value of \${key} operator must be a number\`)
            }
        }

        if (accumulators.indexOf(key) > -1) {
            const index = query.findIndex(item => item.$group)
            if (index > -1 && query.findIndex(item => item.$sort) > -1) {
                if (obj[key].alias) {
                    query[index].$group[obj[key].alias] = { [\`$\${key}\`]: \`$\${obj[key].value}\` }
                } else {
                    query[index].$group[obj[key]] = { [\`$\${key}\`]: \`$\${obj[key]}\` }
                }
            } else {
                throw new apiError(400, \`The \${key} operator only meaningful when documents are grouped and in a defined order.\`)
            }
        }
    })
}

function buildFieldsQuery(obj, attr, query, type, operators, schema) {
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
                    
                    attr = buildFieldsQuery(obj[key], attr, query, type, operators, schema)
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
                            if (key == '_id') {
                                if (Array.isArray(obj[key])) {
                                    let values = []
                                    for (let val of obj[key]) values.push(mongoose.Types.ObjectId(val))
                                    item.$match[attr] = { $in: values }
                                } else {
                                    item.$match[attr] = mongoose.Types.ObjectId(obj[key])
                                }
                            } else if (schema[key] && schema[key].type == 'Date') {
                                if (Array.isArray(obj[key])) {
                                    let values = []
                                    for (let val of obj[key]) values.push(DateTime.fromISO(val, { zone: 'utc' }))
                                    item.$match[attr] = { $in: values }
                                } else {
                                    item.$match[attr] = DateTime.fromISO(obj[key], { zone: 'utc' })
                                }
                            } else if (schema[key] && schema[key].type == 'Number') {
                                if (Array.isArray(obj[key])) {
                                    let values = []
                                    for (let val of obj[key]) values.push(parseFloat(val))
                                    item.$match[attr] = { $in: values }
                                } else {
                                    item.$match[attr] = parseFloat(obj[key])
                                }
                            } else {
                                item.$match[attr] = obj[key]
                                if (Array.isArray(obj[key])) item.$match[attr] = { $in: obj[key] }
                            }
                            
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

                    attr = buildFieldsQuery(obj[key], attr, query, type, operators, schema)
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

function buildJsonQuery(obj, type, schema) {
    let query = {}
    const keys = Object.keys(obj)
    
    if (keys.length > 0) {
        let attr = ''
        obj.pattern = ''
        const operators = getOperators()
        const operator = operators.find(item => keys.indexOf(item) > -1)
        
        if (type == 'aggregate') {
            query = [{ $match: {} }]
            const filters = Object.keys(obj).filter(key => {
                if (operators.indexOf(key) == -1) return key
            })
            
            buildFieldsQuery(obj, attr, query, type, operators, schema)

            if (!filters.length) {
                const index = query.findIndex(item => item.$match)
                query[index].$match = { _id : {$ne: ""} }
            }

            if (operator) buildOperatorsQuery(obj, query, schema)
        } else {
            buildFieldsQuery(obj, attr, query, type, operators, schema)
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
    buildJsonQuery
}`

    return template
}

module.exports = content