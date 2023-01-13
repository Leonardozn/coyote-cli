const utils = require('../../../controllers/utils')

function buildSchema(model) {
    let schema = ''
    const properties = ['type', 'ref', 'unique', 'required', 'hidden', 'contentType']
    
    Object.keys(model.fields).forEach((field, i) => {
        if (i > 0) schema += '\t\t'
        schema += `${field}: { `

        properties.forEach((prop, j) => {
            if (Object.keys(model.fields[field]).includes(prop)) {
                schema += `${prop == 'ref' ? 'reference' : prop}: '${model.fields[field][prop]}'`
                if (j < properties.length -1) schema += ', '
            }
        })

        schema += ' }'

        if (i < Object.keys(model.fields).length -1) schema += ',\n'
    })

    return schema
}

function content(modelName, model) {
    let template = `const ${modelName.capitalize()} = require('../models/${modelName}')
const errMsgHelper = require('../helpers/errorMessages')
const mongoQuery = require('./mongo-query')

async function add(req, res, next) {
\ttry {
\t\tif (!Array.isArray(req.body)) {
\t\t\tlet ${modelName} = new ${modelName.capitalize()}(req.body)
\t\t\t${modelName} = await ${modelName}.save()
\t\t\tres.status(201).json(${modelName})
\t\t} else {
\t\t\tconst ${modelName}_list = await ${modelName.capitalize()}.insertMany(req.body)
\t\t\tres.status(201).json(${modelName}_list)
\t\t}
\t} catch (error) {
\t\tconsole.log(error)
\t\tnext(errMsgHelper.buildError(error))
\t}
}

async function selectById(req, res, next) {
\ttry {
\t\tconst ${modelName} = await ${modelName.capitalize()}.findById(req.params.id)
\t\tif (!${modelName}) throw { status: 404, message: '${modelName.capitalize()} no found.' }

\t\tres.status(200).json(${modelName})
\t} catch (error) {
\t\tconsole.log(error)
\t\tnext(errMsgHelper.buildError(error))
\t}
}

async function list(req, res, next) {
\ttry {${model.auth ? `
\t\tif (!Object.keys(req.query).length) {
\t\t\treq.query.projects = { password: 0 }
\t\t} else {
\t\t\tif (req.query.projects && req.query.projects.password) {
\t\t\t\tdelete req.query.projects.password
\t\t\t\tif (!Object.keys(req.query.projects).length) req.query.projects = { password: 0 }
\t\t\t} else {
\t\t\t\treq.query.projects = { password: 0 }
\t\t\t}
\t\t}\n` : ''}
\t\tconst query = mongoQuery.buildJsonQuery(req.query, 'aggregate', schema())
\t\tconst ${modelName}_list = await ${modelName.capitalize()}.aggregate(query)
\t\tres.status(200).json(${modelName}_list)
\t} catch (error) {
\t\tconsole.log(error)
\t\tnext(errMsgHelper.buildError(error))
\t}
}

async function update(req, res, next) {
\ttry {
\t\tif (Object.keys(req.query).length) {
\t\t\tconst query = mongoQuery.buildJsonQuery(req.query, 'find', schema())
\t\t\tconst results = await ${modelName.capitalize()}.find(query)
\t\t\tlet modify = req.body
\t\t\tif (Array.isArray(modify)) modify = modify[modify.length-1]
            
\t\t\tconst promises = results.map(item => {
\t\t\t\tconst { _id, ...body } = modify
\t\t\t\titem = Object.assign(item, body)
\t\t\t\treturn item.save()
\t\t\t})

\t\t\tlet ${modelName}_list = []
\t\t\tif (promises.length) ${modelName}_list = await Promise.all(promises)

\t\t\tres.status(200).json(${modelName}_list)
\t\t} else {
\t\t\tif (!Array.isArray(req.body)) {
\t\t\t\tlet ${modelName} = await ${modelName.capitalize()}.findById(req.body._id)
\t\t\t\tif (!${modelName}) throw { status: 404, message: '${modelName.capitalize()} no found.' }
    
\t\t\t\t${modelName} = Object.assign(${modelName}, req.body)
\t\t\t\t${modelName} = await ${modelName}.save()
\t\t\t\tres.status(200).json(${modelName})
\t\t\t} else {
\t\t\t\tconst promises = req.body.map(async (item) => {
\t\t\t\t\tlet ${modelName} = await ${modelName.capitalize()}.findById(item._id)
\t\t\t\t\tif (!${modelName}) throw { status: 404, message: \`The ${modelName} \${item._id} was not found.\` }
    
\t\t\t\t\t${modelName} = Object.assign(${modelName}, item)
\t\t\t\t\treturn ${modelName}.save()
\t\t\t\t})
    
\t\t\t\tconst ${modelName}_list = await Promise.all(promises)
\t\t\t\tres.status(200).json(${modelName}_list)
\t\t\t}
\t\t}
\t} catch (error) {
\t\tconsole.log(error)
\t\tnext(errMsgHelper.buildError(error))
\t}
}

async function remove(req, res, next) {
\ttry {
\t\tif (!Object.keys(req.query).length) throw { status: 400, message: 'Query params must be declared.' }

\t\tconst query = mongoQuery.buildJsonQuery(req.query, 'find', schema())
\t\tconst ${modelName}_list = await ${modelName.capitalize()}.remove(query)

\t\tres.status(200).json(${modelName}_list)
\t} catch (error) {
\t\tconsole.log(error)
\t\tnext(errMsgHelper.buildError(error))
\t}
}

function getSchema(req, res, next) {
\tres.status(200).json(schema())
}

function schema() {
\treturn {
\t\t${buildSchema(model)}
\t}
}

module.exports = {
\tadd,
\tselectById,
\tlist,
\tupdate,
\tremove,
\tgetSchema,
\tschema
}`

    return template
}

module.exports = content