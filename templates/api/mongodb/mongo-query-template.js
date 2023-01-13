function content() {
    let template = `const { DateTime } = require('luxon')

function getOperators(type) {
\tconst generals = ['pattern','or','group','sort','projects','lookup']
\tconst arithmetic = ['sum','subtract','multiply','divide','avg','max','min']
\tconst accumulators = ['first','last']
\tconst logical = ['gt','gte','lt','lte','eq','ne']
\tconst accountants = ['limit','skip']
\tconst dateOperator = ['dateOperator']
    
\tif (type == 'generals') return generals
\tif (type == 'arithmetic') return arithmetic
\tif (type == 'accumulators') return accumulators
\tif (type == 'logical') return logical
\tif (type == 'accountants') return accountants
\tif (type == 'dateOperator') return dateOperator

\treturn generals.concat(arithmetic, accumulators, logical, accountants, dateOperator)
}

function isObject(val) {
\tif (val === null) return false
\tif (Array.isArray(val)) return false
\tif (typeof val == 'object') return true
\treturn false
}

function buildOrOperatorValues(logical, objValue, field, schema) {
\tconst logical_operator = Object.keys(objValue).filter(item => logical.indexOf(item) > -1)
\tlet obj = { [field]: {} }
    
\tif (logical_operator.length) {
\t\tfor (let operator of logical_operator) {
\t\t\tif (objValue[operator] && typeof objValue[operator] != 'object') {
\t\t\t\tlet value = objValue[operator]
                
\t\t\t\tif (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
\t\t\t\tif (schema[field] && schema[field].type == 'Number') value = parseFloat(value)

\t\t\t\tobj[field][\`$\${operator}\`] = value
\t\t\t} else {
\t\t\t\tthrow { status: 400, message: \`The '\${operator}' logical operator for '\${key}' operator must be a single value.\` }
\t\t\t}
\t\t}
\t}
    
\treturn obj
}

function buildExpressionValue(value, result, operator, list, pattern) {
\tif (isObject(value)) {
\t\tObject.keys(value).forEach(key => {
\t\t\tif (list.indexOf(key) > -1) {
\t\t\t\tresult = buildExpressionValue(value[key], result, key, list, false)
\t\t\t}
\t\t})
\t} else if (Array.isArray(value)) {
\t\tif (pattern) {
\t\t\tif (result.findIndex(item => item[\`$\${operator}\`]) == -1) result.push({ [\`$\${operator}\`]: [] })
\t\t} else {
\t\t\tif (!result[\`$\${operator}\`]) result[\`$\${operator}\`] = []
\t\t}
        
\t\tfor (let val of value) {
\t\t\tif (isObject(val)) {
\t\t\t\tObject.keys(val).forEach(field => {
\t\t\t\t\tif (list.indexOf(field) > -1) {
\t\t\t\t\t\tval = buildExpressionValue(val[field], result[\`$\${operator}\`], field, list, true)
\t\t\t\t\t\tresult[\`$\${operator}\`] = val
\t\t\t\t\t}
\t\t\t\t})
\t\t\t} else if (!isNaN(val)) {
\t\t\t\tif (pattern) {
\t\t\t\t\tresult[result.findIndex(item => item[\`$\${operator}\`])][\`$\${operator}\`].push(parseFloat(val))
\t\t\t\t} else {
\t\t\t\t\tresult[\`$\${operator}\`].push(parseFloat(val))
\t\t\t\t}
\t\t\t} else {
\t\t\t\tif (pattern) {
\t\t\t\t\tresult[result.findIndex(item => item[\`$\${operator}\`])][\`$\${operator}\`].push(\`$\${val}\`)
\t\t\t\t} else {
\t\t\t\t\tresult[\`$\${operator}\`].push(\`$\${val}\`)
\t\t\t\t}
\t\t\t}
\t\t}
\t} else {
\t\tif (!isNaN(value)) {
\t\t\tif (pattern) {
\t\t\t\tconst index = result.findIndex(item => item[\`$\${operator}\`])
\t\t\t\tif (index > -1) {
\t\t\t\t\tresult[index][\`$\${operator}\`] = parseFloat(value)
\t\t\t\t} else {
\t\t\t\t\tresult.push({ [\`$\${operator}\`]: parseFloat(value) })
\t\t\t\t}
\t\t\t} else {
\t\t\t\tresult[\`$\${operator}\`] = parseFloat(value)
\t\t\t}
\t\t} else {
\t\t\tif (pattern) {
\t\t\t\tconst index = result.findIndex(item => item[\`$\${operator}\`])
\t\t\t\tif (index > -1) {
\t\t\t\t\tresult[index][\`$\${operator}\`] = \`$\${value}\`
\t\t\t\t} else {
\t\t\t\t\tresult.push({ [\`$\${operator}\`]: \`$\${value}\` })
\t\t\t\t}
\t\t\t} else {
\t\t\t\tresult[\`$\${operator}\`] = \`$\${value}\`
\t\t\t}
\t\t}
\t}
    
\treturn result
}

function buildSubOperatorsQuery(obj, query, schema, type) {
\tconst arithmetic = getOperators('arithmetic')
\tconst accumulators = getOperators('accumulators')
\tconst logical = getOperators('logical')
\tconst accountants = getOperators('accountants')

\tObject.keys(obj).forEach(key => {
\t\tif (type == 'aggregate') {
\t\t\tif (key == 'or') {
\t\t\t\tif (isObject(obj[key])) {
\t\t\t\t\tconst index = query.findIndex(item => item.$match)

\t\t\t\t\tif (index > -1) {
\t\t\t\t\t\tquery[index].$match.$or = []
                        
\t\t\t\t\t\tObject.keys(obj[key]).forEach(field => {
\t\t\t\t\t\t\tif (isObject(obj[key][field])) {
\t\t\t\t\t\t\t\tconst objValue = buildOrOperatorValues(logical, obj[key][field], field, schema)
\t\t\t\t\t\t\t\tquery[index].$match.$or.push(objValue)
\t\t\t\t\t\t\t} else if(Array.isArray(obj[key][field])) {
\t\t\t\t\t\t\t\tfor (let element of obj[key][field]) {
\t\t\t\t\t\t\t\t\tif (isObject(element)) {
\t\t\t\t\t\t\t\t\t\tconst objValue = buildOrOperatorValues(logical, element, field, schema)
\t\t\t\t\t\t\t\t\t\tquery[index].$match.$or.push(objValue)
\t\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\t\tlet value = element
    
\t\t\t\t\t\t\t\t\t\tif (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
\t\t\t\t\t\t\t\t\t\tif (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
            
\t\t\t\t\t\t\t\t\t\tquery[index].$match.$or.push({ [field]: value })
\t\t\t\t\t\t\t\t\t\tif (query[index].$match[field]) delete query[index].$match[field]
\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\tlet value = obj[key][field]
    
\t\t\t\t\t\t\t\tif (schema[field] && schema[field].type == 'Date') value = DateTime.fromISO(value, { zone: 'utc' })
\t\t\t\t\t\t\t\tif (schema[field] && schema[field].type == 'Number') value = parseFloat(value)
    
\t\t\t\t\t\t\t\tquery[index].$match[\`$\${key}\`].push({ [field]: value })
\t\t\t\t\t\t\t\tif (query[index].$match[field]) delete query[index].$match[field]
\t\t\t\t\t\t\t}
                            
\t\t\t\t\t\t})
\t\t\t\t\t}
\t\t\t\t} else {
\t\t\t\t\tthrow { status: 400, message: \`The '\${key}' operator must be a object with the names of fields to change and its values.\` }
\t\t\t\t}
\t\t\t}

\t\t\tif (key == 'group') {
\t\t\t\tlet group = null
            
\t\t\t\tif (Array.isArray(obj.group)) {
\t\t\t\t\tgroup = { $group: { _id: {} } }
\t\t\t\t\tfor (let field of obj.group) group.$group._id[field] = \`$\${field}\`
\t\t\t\t} else if (isObject(obj.group)) {
\t\t\t\t\tif (!obj.group.field) throw { status: 400, message: \`If the 'group' operator is a object, this must contain the attribute 'field' at least.\` }
\t\t\t\t\tif (isObject(obj.group.field) || Array.isArray(obj.group.field)) {
\t\t\t\t\t\tthrow { status: 400, message: \`The attribute 'field' can not be an object or array.\` }
\t\t\t\t\t}

\t\t\t\t\tif (obj.group.as) {
\t\t\t\t\t\tgroup = { $group: { _id: { [\`\${obj.group.as}\`]: \`$\${obj.group.field}\` } } }
\t\t\t\t\t} else {
\t\t\t\t\t\tgroup = { $group: { _id: \`$\${obj.group.field}\` } }
\t\t\t\t\t}
\t\t\t\t} else {
\t\t\t\t\tgroup = { $group: { _id: \`$\${obj.group}\` } }
\t\t\t\t}
                
\t\t\t\tfor (let operator of arithmetic) {
\t\t\t\t\tif (Object.keys(obj).indexOf(operator) > -1 && obj[operator].group) {
                        
\t\t\t\t\t\tif (isObject(obj[operator].group)) {
\t\t\t\t\t\t\tfor (let field in obj[operator].group) {
\t\t\t\t\t\t\t\tconst val = buildExpressionValue(obj[operator].group[field], {}, operator, arithmetic, false)
\t\t\t\t\t\t\t\tif (Object.keys(val).some(item => item == \`$\${operator}\`)) {
\t\t\t\t\t\t\t\t\tgroup.$group[field] = val
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\tgroup.$group[field] = { [\`$\${operator}\`]: val }
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tthrow { status: 400, message: \`The '\${operator}' operator must be an object with at least a 'group' or 'projects' field.\` }
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t}
                
\t\t\t\tquery.push(group)
\t\t\t}
            
\t\t\tif (key == 'projects') {
\t\t\t\tlet index = query.findIndex(item => item.$project)
\t\t\t\tif (index == -1) {
\t\t\t\t\tquery.push({ $project: {} })
\t\t\t\t\tindex = query.length - 1
\t\t\t\t}

\t\t\t\tif (!isObject(obj.projects)) throw { status: 400, message: \`The 'projects' operator must be a object with the fields to be trated.\` }
                
\t\t\t\tObject.keys(obj.projects).forEach(field => {
\t\t\t\t\tif (!query[index].$project[field]) query[index].$project[field] = parseInt(obj.projects[field])
\t\t\t\t})
                
\t\t\t\tfor (let operator of arithmetic) {
\t\t\t\t\tif (Object.keys(obj).indexOf(operator) > -1 && obj[operator].projects) {
\t\t\t\t\t\tif (isObject(obj[operator].projects)) {
\t\t\t\t\t\t\tfor (let field in obj[operator].projects) {
\t\t\t\t\t\t\t\tconst val = buildExpressionValue(obj[operator].projects[field], {}, operator, arithmetic, false)
\t\t\t\t\t\t\t\tif (Object.keys(val).some(item => item == \`$\${operator}\`)) {
\t\t\t\t\t\t\t\t\tquery[index].$project[field] = val
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\tquery[index].$project[field] = { [\`$\${operator}\`]: val }
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tthrow { status: 400, message: \`The '\${operator}' operator must be an object with at least a 'group' or 'projects' field.\` }
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
            
\t\t\tif (logical.indexOf(key) > -1) {
\t\t\t\tconst index = query.findIndex(item => item.$match)
            
\t\t\t\tfor (let operator of logical) {
\t\t\t\t\tif (operator == key) {
\t\t\t\t\t\tif (isObject(obj[key])) {
\t\t\t\t\t\t\tlet value = null
    
\t\t\t\t\t\t\tfor (let attr in obj[key]) {
\t\t\t\t\t\t\t\tif (obj[key][attr] && typeof obj[key][attr] != 'object') {
\t\t\t\t\t\t\t\t\tif (schema[attr] && schema[attr].type == 'Date') {
\t\t\t\t\t\t\t\t\t\tvalue = DateTime.fromISO(obj[key][attr], { zone: 'utc' })
\t\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\t\tvalue = obj[key][attr]
\t\t\t\t\t\t\t\t\t\tif (!isNaN(value)) value = parseFloat(obj[key][attr])
\t\t\t\t\t\t\t\t\t}
                
\t\t\t\t\t\t\t\t\tif (query[index].$match[attr]) {
\t\t\t\t\t\t\t\t\t\tquery[index].$match[attr][\`$\${key}\`] = value
\t\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\t\tquery[index].$match[attr] = { [\`$\${key}\`]: value }
\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\tthrow { status: 400, message: \`The values for the operator '\${key}' must be singles.\` }
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tthrow { status: 400, message: \`The operator '\${key}' must be a object with the fields and values to comparate.\` }
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
            
\t\t\tif (key == 'sort') {
\t\t\t\tlet sort = { $sort: {} }
\t\t\t\tfor (let field in obj.sort) {
\t\t\t\t\tif (Array.isArray(obj.sort[field]) || (parseInt(obj.sort[field]) !== -1 && parseInt(obj.sort[field]) !== 1)) {
\t\t\t\t\t\tthrow { status: 400, message: \`The operator 'sort' only accept -1 or 1 as value on each field.\` }
\t\t\t\t\t} else {
\t\t\t\t\t\tsort.$sort[field] = parseInt(obj.sort[field])
\t\t\t\t\t}
\t\t\t\t}
            
\t\t\t\tquery.push(sort)
\t\t\t}
            
\t\t\tif (accountants.indexOf(key) > -1) {
\t\t\t\tif (!isNaN(obj[key])) {
\t\t\t\t\tlet index = query.findIndex(item => item[\`$\${key}\`])
\t\t\t\t\tif (index > -1) {
\t\t\t\t\t\tquery[index][\`$\${key}\`] = parseInt(obj[key])
\t\t\t\t\t} else {
\t\t\t\t\t\tquery.push({ [\`$\${key}\`]: parseInt(obj[key]) })
\t\t\t\t\t}
\t\t\t\t} else {
\t\t\t\t\tthrow { status: 400, message: \`The value of \${key} operator must be a number.\` }
\t\t\t\t}
\t\t\t}
            
\t\t\tif (accumulators.indexOf(key) > -1) {
\t\t\t\tconst index = query.findIndex(item => item.$group)
\t\t\t\tif (index > -1 && query.findIndex(item => item.$sort) > -1) {
\t\t\t\t\tif (obj[key].as) {
\t\t\t\t\t\tquery[index].$group[obj[key].as] = { [\`$\${key}\`]: \`$\${obj[key].value}\` }
\t\t\t\t\t} else {
\t\t\t\t\t\tquery[index].$group[obj[key]] = { [\`$\${key}\`]: \`$\${obj[key]}\` }
\t\t\t\t\t}
\t\t\t\t} else {
\t\t\t\t\tthrow { status: 400, message: \`The \${key} operator only meaningful when documents are grouped and in a defined order.\` }
\t\t\t\t}
\t\t\t}
            
\t\t\tif (key == 'dateOperator') {
\t\t\t\tlet index = query.findIndex(item => item.$project)
            
\t\t\t\tif (index == -1) {
\t\t\t\t\tquery.push({ $project: { _id: 0 } })
\t\t\t\t\tindex = query.length - 1
\t\t\t\t}
            
\t\t\t\tif (obj[key].as && obj[key].operator && obj[key].field) {
\t\t\t\t\tconst operators = ['year','month','dayOfMonth','hour','minute','second','millisecond','dayOfYear','dayOfWeek','week']
            
\t\t\t\t\tif (operators.indexOf(obj[key].operator) > -1) {
\t\t\t\t\t\tquery[index].$project[obj[key].as] = { [\`$\${obj[key].operator}\`]: \`$\${obj[key].field}\` }
\t\t\t\t\t} else {
\t\t\t\t\t\tthrow { status: 400, message: \`The operator \${obj[key].operator} indicated is not recognized.\` }
\t\t\t\t\t}
\t\t\t\t} else {
\t\t\t\t\tthrow { status: 400, message: \`The operator '\${key}' must have the keys 'as', 'operator' and 'field'\` }
\t\t\t\t}
\t\t\t}
\t\t} else {
\t\t\tif (logical.indexOf(key) > -1) {
\t\t\t\tfor (let operator of logical) {
\t\t\t\t\tif (operator == key) {
\t\t\t\t\t\tif (isObject(obj[key])) {
\t\t\t\t\t\t\tlet value = null
                            
\t\t\t\t\t\t\tfor (let attr in obj[key]) {
\t\t\t\t\t\t\t\tif (obj[key][attr] && typeof obj[key][attr] != 'object') {
\t\t\t\t\t\t\t\t\tif (schema[attr] && schema[attr].type == 'Date') {
\t\t\t\t\t\t\t\t\t\tvalue = DateTime.fromISO(obj[key][attr], { zone: 'utc' })
\t\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\t\tvalue = obj[key][attr]
\t\t\t\t\t\t\t\t\t\tif (!isNaN(value)) value = parseFloat(obj[key][attr])
\t\t\t\t\t\t\t\t\t}
                
\t\t\t\t\t\t\t\t\tif (!query[attr]) query[attr] = {}
\t\t\t\t\t\t\t\t\tquery[attr][\`$\${key}\`] = value
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\tthrow { status: 400, message: \`The values for the operator '\${key}' must be singles.\` }
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tthrow { status: 400, message: \`The operator '\${key}' must be a object with the fields and values to comparate.\` }
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
\t\t}
\t})
}

function buildLookUp(obj, query, schema, type) {
\tlet lookup = { $lookup: {} }
    
\tif (obj.from && obj.as && obj.localField) {
\t\tif (obj.pipeline) {
\t\t\tif (typeof obj.localField != 'string') throw { status: 400, message: \`The key 'localField' must be string\` }

\t\t\tlookup.$lookup.pipeline = buildJsonQuery(obj.pipeline, type, schema)
            
\t\t\tlet op = '$eq'
\t\t\tlet from = obj.from
\t\t\tconst index = lookup.$lookup.pipeline.findIndex(item => item.$match)
            
\t\t\tlookup.$lookup.let = { [\`\${obj.as}\`]: \`$\${obj.localField}\` }
\t\t\tif (schema[from] && schema[from].type == 'Array') op = '$in'
\t\t\tlookup.$lookup.pipeline[index].$match.$expr = { [op]: ['$_id', \`$$\${obj.as}\`] }
\t\t} else {
\t\t\tif (!obj.foreignField || !obj.localField) {
\t\t\t\tthrow { status: 400, message: \`If the operator 'lookup' not have 'pipeline' declared, it's must have the 'foreignField' and 'localField' keys.\` }
\t\t\t} else {
\t\t\t\tif (typeof obj.foreignField == 'string' && typeof obj.localField == 'string') {
\t\t\t\t\tlookup.$lookup.foreignField = obj.foreignField
\t\t\t\t\tlookup.$lookup.localField = obj.localField
\t\t\t\t} else {\t
\t\t\t\t\tthrow { status: 400, message: \`The key 'foreignField' and 'localField' must be string\` }
\t\t\t\t}
\t\t\t}
\t\t}
        
\t\tif (typeof obj.from == 'string' && typeof obj.as == 'string') {
\t\t\tlookup.$lookup.from = obj.from
\t\t\tlookup.$lookup.as = obj.as
\t\t} else {
\t\t\tthrow { status: 400, message: \`The keys 'from' and 'as' must be string\` }
\t\t}
\t} else {
\t\tthrow { status: 400, message: \`The operator 'lookup' must have the keys 'from', 'as' and 'localField' at least\` }
\t}
    
\tquery.push(lookup)
}

function buildOperatorsQuery(obj, query, schema, type) {
\tbuildSubOperatorsQuery(obj, query, schema, type)

\tif (type == 'aggregate') {
\t\tif (Object.keys(obj).indexOf('lookup') > -1) {
\t\t\tif (isObject(obj.lookup)) buildLookUp(obj.lookup, query, schema, type)
\t\t\tif (Array.isArray(obj.lookup)) {
\t\t\t\tfor (let item of obj.lookup) buildLookUp(item, query, schema, type)
\t\t\t}
\t\t}
\t}
}

function buildNestedAttr(obj, attr) {
\tlet fields = attr.split('.')
\tif (!fields[0].length) fields.shift()
\tattr = ''
\tfor (let field of fields) {
\t\tattr += \`.\${field}\`
\t\tif (field == obj.pattern) break 
\t}
\treturn attr
}

function buildFieldsQuery(obj, attr, query, type, operators, schema) {
\tconst keys = Object.keys(obj).filter(key => {
\t\tif (operators.indexOf(key) == -1) return key
\t})
    
\tkeys.forEach(key => {
\t\tif (operators.indexOf(key) == -1) {
\t\t\tif (isObject(obj[key])) {
\t\t\t\tobj[key].pattern = key
\t\t\t\tif (obj.pattern) {
\t\t\t\t\tattr = buildNestedAttr(obj, attr)
\t\t\t\t\tattr += \`.\${key}\`
\t\t\t\t} else {
\t\t\t\t\tattr = \`.\${key}\`
\t\t\t\t}

\t\t\t\tattr = buildFieldsQuery(obj[key], attr, query, type, operators, schema)
\t\t\t} else {
\t\t\t\tif (obj.pattern) {
\t\t\t\t\tattr = buildNestedAttr(obj, attr)
\t\t\t\t\tattr += \`.\${key}\`
\t\t\t\t} else {
\t\t\t\t\tattr = \`.\${key}\`
\t\t\t\t}
                
\t\t\t\tif (attr.indexOf('.') == 0) attr = attr.replace('.', '')

\t\t\t\tif (type == 'aggregate') {
\t\t\t\t\tfor (let item of query) {
\t\t\t\t\t\tif (item.$match) {
\t\t\t\t\t\t\tif (key == '_id') {
\t\t\t\t\t\t\t\tif (Array.isArray(obj[key])) {
\t\t\t\t\t\t\t\t\tlet values = []
\t\t\t\t\t\t\t\t\tfor (let val of obj[key]) values.push(mongoose.Types.ObjectId(val))
\t\t\t\t\t\t\t\t\titem.$match[attr] = { $in: values }
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\titem.$match[attr] = mongoose.Types.ObjectId(obj[key])
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t} else if (schema[key] && schema[key].type == 'Date') {
\t\t\t\t\t\t\t\tif (Array.isArray(obj[key])) {
\t\t\t\t\t\t\t\t\tlet values = []
\t\t\t\t\t\t\t\t\tfor (let val of obj[key]) values.push(DateTime.fromISO(val, { zone: 'utc' }))
\t\t\t\t\t\t\t\t\titem.$match[attr] = { $in: values }
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\titem.$match[attr] = DateTime.fromISO(obj[key], { zone: 'utc' })
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t} else if (schema[key] && schema[key].type == 'Number') {
\t\t\t\t\t\t\t\tif (Array.isArray(obj[key])) {
\t\t\t\t\t\t\t\t\tlet values = []
\t\t\t\t\t\t\t\t\tfor (let val of obj[key]) values.push(parseFloat(val))
\t\t\t\t\t\t\t\t\titem.$match[attr] = { $in: values }
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\titem.$match[attr] = parseFloat(obj[key])
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\titem.$match[attr] = obj[key]
\t\t\t\t\t\t\t\tif (Array.isArray(obj[key])) item.$match[attr] = { $in: obj[key] }
\t\t\t\t\t\t\t}
                            
\t\t\t\t\t\t\tbreak
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t} else {
\t\t\t\t\tif (schema[key] && schema[key].type == 'Date') {
\t\t\t\t\t\tif (Array.isArray(obj[key])) {
\t\t\t\t\t\t\tlet values = []
\t\t\t\t\t\t\tfor (let val of obj[key]) values.push(DateTime.fromISO(val, { zone: 'utc' }))
\t\t\t\t\t\t\tquery[attr] = { $in: values }
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tquery[attr] = DateTime.fromISO(obj[key], { zone: 'utc' })
\t\t\t\t\t\t}
\t\t\t\t\t} else if (schema[key] && schema[key].type == 'Number') {
\t\t\t\t\t\tif (Array.isArray(obj[key])) {
\t\t\t\t\t\t\tlet values = []
\t\t\t\t\t\t\tfor (let val of obj[key]) values.push(parseFloat(val))
\t\t\t\t\t\t\tquery[attr] = { $in: values }
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tquery[attr] = parseFloat(obj[key])
\t\t\t\t\t\t}
\t\t\t\t\t} else {
\t\t\t\t\t\tif (Array.isArray(obj[key])) {
\t\t\t\t\t\t\tlet elementsAreObjects = true
\t\t\t\t\t\t\tfor (let item of obj[key]) {
\t\t\t\t\t\t\t\tif (!isObject(item)) elementsAreObjects = false
\t\t\t\t\t\t\t}

\t\t\t\t\t\t\tif (elementsAreObjects) {
\t\t\t\t\t\t\t\tquery[attr] = { $elemMatch: {} }

\t\t\t\t\t\t\t\tfor (let item of obj[key]) {
\t\t\t\t\t\t\t\t\tObject.keys(item).forEach(field => {
\t\t\t\t\t\t\t\t\t\tif (!query[attr].$elemMatch[field]) query[attr].$elemMatch[field] = { $in: [] }
\t\t\t\t\t\t\t\t\t\tquery[attr].$elemMatch[field].$in.push(item[field])
\t\t\t\t\t\t\t\t\t})
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\tquery[attr] = { $in: obj[key] }
\t\t\t\t\t\t\t}
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tquery[attr] = obj[key]
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
\t\t}
\t})
    
\treturn attr
}

function buildJsonQuery(obj, type, schema) {
\tlet query = {}
\tconst keys = Object.keys(obj)

\t// Sorting operators for paging
\tif (obj.limit && obj.skip) {
\t\tconst skip = obj.skip
\t\tconst limit = obj.limit
\t\tdelete obj.skip
\t\tdelete obj.limit
\t\tobj.skip = skip
\t\tobj.limit = limit
\t}
    
\tlet attr = ''
\tobj.pattern = ''
\tconst operators = getOperators()
\tconst operator = operators.find(item => keys.indexOf(item) > -1)
\tconst filters = Object.keys(obj).filter(key => {
\t\tif (operators.indexOf(key) == -1) return key
\t})
    
\tif (filters.length) {
\t\tif (type == 'aggregate') query = [{ $match: {} }]
\t\tbuildFieldsQuery(obj, attr, query, type, operators, schema)
\t} else {
\t\tif (type == 'aggregate') query = [{ $match: { _id: {$ne: ""} } }]
\t}
    
\tif (operator) buildOperatorsQuery(obj, query, schema, type)
    
\treturn query
}
    
module.exports = {
\tbuildJsonQuery
}`

    return template
}

module.exports = content