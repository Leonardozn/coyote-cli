function content() {
    let template = `const { DateTime } = require('luxon')

function getOperators(type) {
    const generals = ['pattern','or','group','sort','projects','lookup']
    const arithmetic = ['sum','subtract','multiply','divide','avg','max','min']
    const accumulators = ['first','last']
    const logical = ['gt','gte','lt','lte','eq','ne']
    const accountants = ['limit','skip']
    const dateOperator = ['dateOperator']
    
    if (type == 'generals') return generals
    if (type == 'arithmetic') return arithmetic
    if (type == 'accumulators') return accumulators
    if (type == 'logical') return logical
    if (type == 'accountants') return accountants
    if (type == 'dateOperator') return dateOperator

    return generals.concat(arithmetic, accumulators, logical, accountants, dateOperator)
}

function isObject(val) {
    if (val === null) return false
    if (Array.isArray(val)) return false
    if (typeof val == 'object') return true
    return false
}

function buildOrOperatorValues(logical, objValue, field, schema) {
    const logical_operator = Object.keys(objValue).filter(item => logical.indexOf(item) > -1)
    let obj = { [field]: {} }
    
    if (logical_operator.length) {
        for (let operator of logical_operator) {
            if (objValue[operator] && typeof objValue[operator] != 'object') {
                let value = objValue[operator]
                
                if (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
                if (schema[field] && schema[field].type == 'Number') value = parseFloat(value)

                obj[field][\`$\${operator}\`] = value
            } else {
                throw { status: 400, message: \`The '\${operator}' logical operator for '\${key}' operator must be a single value.\` }
            }
        }
    }
    
    return obj
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
                const index = result.findIndex(item => item[\`$\${operator}\`])
                if (index > -1) {
                    result[index][\`$\${operator}\`] = parseFloat(value)
                } else {
                    result.push({ [\`$\${operator}\`]: parseFloat(value) })
                }
            } else {
                result[\`$\${operator}\`] = parseFloat(value)
            }
        } else {
            if (pattern) {
                const index = result.findIndex(item => item[\`$\${operator}\`])
                if (index > -1) {
                    result[index][\`$\${operator}\`] = \`$\${value}\`
                } else {
                    result.push({ [\`$\${operator}\`]: \`$\${value}\` })
                }
            } else {
                result[\`$\${operator}\`] = \`$\${value}\`
            }
        }
    }
    
    return result
}

function buildSubOperatorsQuery(obj, query, schema, type) {
    const arithmetic = getOperators('arithmetic')
    const accumulators = getOperators('accumulators')
    const logical = getOperators('logical')
    const accountants = getOperators('accountants')

    Object.keys(obj).forEach(key => {
        if (type == 'aggregate') {
            if (key == 'or') {
                if (isObject(obj[key])) {
                    const index = query.findIndex(item => item.$match)

                    if (index > -1) {
                        query[index].$match.$or = []
                        
                        Object.keys(obj[key]).forEach(field => {
                            if (isObject(obj[key][field])) {
                                const objValue = buildOrOperatorValues(logical, obj[key][field], field, schema)
                                query[index].$match.$or.push(objValue)
                            } else if(Array.isArray(obj[key][field])) {
                                for (let element of obj[key][field]) {
                                    if (isObject(element)) {
                                        const objValue = buildOrOperatorValues(logical, element, field, schema)
                                        query[index].$match.$or.push(objValue)
                                    } else {
                                        let value = element
    
                                        if (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
                                        if (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
            
                                        query[index].$match.$or.push({ [field]: value })
                                        if (query[index].$match[field]) delete query[index].$match[field]
                                    }
                                }
                            } else {
                                let value = obj[key][field]
    
                                if (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
                                if (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
    
                                query[index].$match[\`$\${key}\`].push({ [field]: value })
                                if (query[index].$match[field]) delete query[index].$match[field]
                            }
                            
                        })
                    }
                } else {
                    throw { status: 400, message: \`The '\${key}' operator must be a object with the names of fields to change and its values.\` }
                }
            }

            if (key == 'group') {
                let group = null
            
                if (Array.isArray(obj.group)) {
                    group = { $group: { _id: {} } }
                    for (let field of obj.group) group.$group._id[field] = \`$\${field}\`
                } else if (isObject(obj.group)) {
                    if (!obj.group.field) throw { status: 400, message: \`If the 'group' operator is a object, this must contain the attribute 'field' at least.\` }
                    if (isObject(obj.group.field) || Array.isArray(obj.group.field)) {
                        throw { status: 400, message: \`The attribute 'field' can not be an object or array.\` }
                    }

                    if (obj.group.as) {
                        group = { $group: { _id: { [\`\${obj.group.as}\`]: \`$\${obj.group.field}\` } } }
                    } else {
                        group = { $group: { _id: \`$\${obj.group.field}\` } }
                    }
                } else {
                    group = { $group: { _id: \`$\${obj.group}\` } }
                }
                
                for (let operator of arithmetic) {
                    if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].group) {
                        
                        if (isObject(obj[operator].group)) {
                            for (let field in obj[operator].group) {
                                const val = buildExpressionValue(obj[operator].group[field], {}, operator, arithmetic, false)
                                if (Object.keys(val).some(item => item == \`$\${operator}\`)) {
                                    group.$group[field] = val
                                } else {
                                    group.$group[field] = { [\`$\${operator}\`]: val }
                                }
                            }
                        } else {
                            throw { status: 400, message: \`The '\${operator}' operator must be an object with at least a 'group' or 'projects' field.\` }
                        }
                    }
                }
                
                query.push(group)
            }
            
            if (key == 'projects') {
                let index = query.findIndex(item => item.$project)
                if (index == -1) {
                    query.push({ $project: { _id: 0 } })
                    index = query.length - 1
                }

                if (!isObject(obj.projects)) throw { status: 400, message: \`The 'projects' operator must be a object with it's fields to show.\` }
                
                Object.keys(obj.projects).forEach(field => {
                    if (!query[index].$project[field]) query[index].$project[field] = parseInt(obj.projects[field])
                })
                
                for (let operator of arithmetic) {
                    if (Object.keys(obj).indexOf(operator) > -1 && obj[operator].projects) {
                        if (isObject(obj[operator].projects)) {
                            for (let field in obj[operator].projects) {
                                const val = buildExpressionValue(obj[operator].projects[field], {}, operator, arithmetic, false)
                                if (Object.keys(val).some(item => item == \`$\${operator}\`)) {
                                    query[index].$project[field] = val
                                } else {
                                    query[index].$project[field] = { [\`$\${operator}\`]: val }
                                }
                            }
                        } else {
                            throw { status: 400, message: \`The '\${operator}' operator must be an object with at least a 'group' or 'projects' field.\` }
                        }
                    }
                }
            }
            
            if (logical.indexOf(key) > -1) {
                const index = query.findIndex(item => item.$match)
            
                for (let operator of logical) {
                    if (operator == key) {
                        if (isObject(obj[key])) {
                            let value = null
    
                            for (let attr in obj[key]) {
                                if (obj[key][attr] && typeof obj[key][attr] != 'object') {
                                    if (schema[attr] && schema[attr].type == 'Date') {
                                        value = DateTime.fromISO(obj[key][attr], { zone: 'utc' })
                                    } else {
                                        value = obj[key][attr]
                                        if (!isNaN(value)) value = parseFloat(obj[key][attr])
                                    }
                
                                    if (query[index].$match[attr]) {
                                        query[index].$match[attr][\`$\${key}\`] = value
                                    } else {
                                        query[index].$match[attr] = { [\`$\${key}\`]: value }
                                    }
                                } else {
                                    throw { status: 400, message: \`The values for the operator '\${key}' must be singles.\` }
                                }
                            }
                        } else {
                            throw { status: 400, message: \`The operator '\${key}' must be a object with the fields and values to comparate.\` }
                        }
                    }
                }
            }
            
            if (key == 'sort') {
                let sort = { $sort: {} }
                for (let field in obj.sort) {
                    if (Array.isArray(obj.sort[field]) || (parseInt(obj.sort[field]) !== -1 && parseInt(obj.sort[field]) !== 1)) {
                        throw { status: 400, message: \`The operator 'sort' only accept -1 or 1 as value on each field.\` }
                    } else {
                        sort.$sort[field] = parseInt(obj.sort[field])
                    }
                }
            
                query.push(sort)
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
                    throw { status: 400, message: \`The value of \${key} operator must be a number.\` }
                }
            }
            
            if (accumulators.indexOf(key) > -1) {
                const index = query.findIndex(item => item.$group)
                if (index > -1 && query.findIndex(item => item.$sort) > -1) {
                    if (obj[key].as) {
                        query[index].$group[obj[key].as] = { [\`$\${key}\`]: \`$\${obj[key].value}\` }
                    } else {
                        query[index].$group[obj[key]] = { [\`$\${key}\`]: \`$\${obj[key]}\` }
                    }
                } else {
                    throw { status: 400, message: \`The \${key} operator only meaningful when documents are grouped and in a defined order.\` }
                }
            }
            
            if (key == 'dateOperator') {
                let index = query.findIndex(item => item.$project)
            
                if (index == -1) {
                    query.push({ $project: { _id: 0 } })
                    index = query.length - 1
                }
            
                if (obj[key].as && obj[key].operator && obj[key].field) {
                    const operators = ['year','month','dayOfMonth','hour','minute','second','millisecond','dayOfYear','dayOfWeek','week']
            
                    if (operators.indexOf(obj[key].operator) > -1) {
                        query[index].$project[obj[key].as] = { [\`$\${obj[key].operator}\`]: \`$\${obj[key].field}\` }
                    } else {
                        throw { status: 400, message: \`The operator \${obj[key].operator} indicated is not recognized.\` }
                    }
                } else {
                    throw { status: 400, message: \`The operator '\${key}' must have the keys 'as', 'operator' and 'field'\` }
                }
            }
        } else {
            if (logical.indexOf(key) > -1) {
                for (let operator of logical) {
                    if (operator == key) {
                        if (isObject(obj[key])) {
                            let value = null
                            
                            for (let attr in obj[key]) {
                                if (obj[key][attr] && typeof obj[key][attr] != 'object') {
                                    if (schema[attr] && schema[attr].type == 'Date') {
                                        value = DateTime.fromISO(obj[key][attr], { zone: 'utc' })
                                    } else {
                                        value = obj[key][attr]
                                        if (!isNaN(value)) value = parseFloat(obj[key][attr])
                                    }
                
                                    if (!query[attr]) query[attr] = {}
                                    query[attr][\`$\${key}\`] = value
                                } else {
                                    throw { status: 400, message: \`The values for the operator '\${key}' must be singles.\` }
                                }
                            }
                        } else {
                            throw { status: 400, message: \`The operator '\${key}' must be a object with the fields and values to comparate.\` }
                        }
                    }
                }
            }
        }
    })
}

function buildLookUp(obj, query, schema, type) {
    let lookup = { $lookup: {} }
    
    if (obj.from && obj.as && obj.localField) {
        if (obj.pipeline) {
            if (typeof obj.localField != 'string') throw { status: 400, message: \`The key 'localField' must be string\` }

            lookup.$lookup.pipeline = buildJsonQuery(obj.pipeline, type, schema)
            
            let op = '$eq'
            let from = obj.from
            const index = lookup.$lookup.pipeline.findIndex(item => item.$match)
            
            lookup.$lookup.let = { [\`\${obj.as}\`]: \`$\${obj.localField}\` }
            if (schema[from] && schema[from].type == 'Array') op = '$in'
            lookup.$lookup.pipeline[index].$match.$expr = { [op]: ['$_id', \`$$\${obj.as}\`] }
        } else {
            if (!obj.foreignField || !obj.localField) {
                throw { status: 400, message: \`If the operator 'lookup' not have 'pipeline' declared, it's must have the 'foreignField' and 'localField' keys.\` }
            } else {
                if (typeof obj.foreignField == 'string' && typeof obj.localField == 'string') {
                    lookup.$lookup.foreignField = obj.foreignField
                    lookup.$lookup.localField = obj.localField
                } else {
                    throw { status: 400, message: \`The key 'foreignField' and 'localField' must be string\` }
                }
            }
        }
        
        if (typeof obj.from == 'string' && typeof obj.as == 'string') {
            lookup.$lookup.from = obj.from
            lookup.$lookup.as = obj.as
        } else {
            throw { status: 400, message: \`The keys 'from' and 'as' must be string\` }
        }
    } else {
        throw { status: 400, message: \`The operator 'lookup' must have the keys 'from', 'as' and 'localField' at least\` }
    }
    
    query.push(lookup)
}

function buildOperatorsQuery(obj, query, schema, type) {
    buildSubOperatorsQuery(obj, query, schema, type)

    if (type == 'aggregate') {
        if (Object.keys(obj).indexOf('lookup') > -1) {
            if (isObject(obj.lookup)) buildLookUp(obj.lookup, query, schema, type)
            if (Array.isArray(obj.lookup)) {
                for (let item of obj.lookup) buildLookUp(item, query, schema, type)
            }
        }
    }
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

function buildFieldsQuery(obj, attr, query, type, operators, schema) {
    const keys = Object.keys(obj).filter(key => {
        if (operators.indexOf(key) == -1) return key
    })
    
    keys.forEach(key => {
        if (operators.indexOf(key) == -1) {
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

                if (type == 'aggregate') {
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
                } else {
                    if (schema[key] && schema[key].type == 'Date') {
                        if (Array.isArray(obj[key])) {
                            let values = []
                            for (let val of obj[key]) values.push(DateTime.fromISO(val, { zone: 'utc' }))
                            query[attr] = { $in: values }
                        } else {
                            query[attr] = DateTime.fromISO(obj[key], { zone: 'utc' })
                        }
                    } else if (schema[key] && schema[key].type == 'Number') {
                        if (Array.isArray(obj[key])) {
                            let values = []
                            for (let val of obj[key]) values.push(parseFloat(val))
                            query[attr] = { $in: values }
                        } else {
                            query[attr] = parseFloat(obj[key])
                        }
                    } else {
                        query[attr] = obj[key]
                    }
                }
            }
        }
    })
    
    return attr
}

function buildJsonQuery(obj, type, schema) {
    let query = {}
    const keys = Object.keys(obj)

    // Sorting operators for paging
    if (obj.limit && obj.skip) {
        const skip = obj.skip
        const limit = obj.limit
        delete obj.skip
        delete obj.limit
        obj.skip = skip
        obj.limit = limit
    }
    
    let attr = ''
    obj.pattern = ''
    const operators = getOperators()
    const operator = operators.find(item => keys.indexOf(item) > -1)
    const filters = Object.keys(obj).filter(key => {
        if (operators.indexOf(key) == -1) return key
    })
    
    if (filters.length) {
        if (type == 'aggregate') query = [{ $match: {} }]
        buildFieldsQuery(obj, attr, query, type, operators, schema)
    } else {
        if (type == 'aggregate') query = [{ $match: { _id: {$ne: ""} } }]
    }
    
    if (operator) buildOperatorsQuery(obj, query, schema, type)
    
    return query
}
    
module.exports = {
    buildJsonQuery
}`

    return template
}

module.exports = content