const utils = require('../../../controllers/utils')

function buildSchema(model) {
    let schema = ''
    const properties = ['type', 'ref', 'unique', 'required', 'hidden']
    
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
    try {
        if (!Array.isArray(req.body)) {
            let ${modelName} = new ${modelName.capitalize()}(req.body)
            ${modelName} = await ${modelName}.save()
            res.status(201).send(${modelName})
        } else {
            const ${modelName}_list = await ${modelName.capitalize()}.insertMany(req.body)
            res.status(201).send(${modelName}_list)
        }
    } catch (error) {
        console.log(error)
        next(errMsgHelper.buildError(error))
    }
}

async function selectById(req, res, next) {
    try {
        const ${modelName} = await ${modelName.capitalize()}.findById(req.params.id)
        if (!${modelName}) throw { status: 404, message: '${modelName.capitalize()} no found.' }

        res.status(200).send(${modelName})
    } catch (error) {
        console.log(error)
        next(errMsgHelper.buildError(error))
    }
}

async function list(req, res, next) {
    try {
        const query = mongoQuery.buildJsonQuery(req.query, 'aggregate', schema())
        const ${modelName}_list = await ${modelName.capitalize()}.aggregate(query)
        res.status(200).send(${modelName}_list)
    } catch (error) {
        console.log(error)
        next(errMsgHelper.buildError(error))
    }
}

async function update(req, res, next) {
    try {
        if (Object.keys(req.query).length) {
            const query = mongoQuery.buildJsonQuery(req.query, 'find', schema())
            const results = await ${modelName.capitalize()}.find(query)
            let modify = req.body
            if (Array.isArray(modify)) modify = modify[modify.length-1]
            
            const promises = results.map(item => {
                const { _id, ...body } = modify
                item = Object.assign(item, body)
                return item.save()
            })

            let ${modelName}_list = []
            if (promises.length) ${modelName}_list = await Promise.all(promises)

            res.status(200).send(${modelName}_list)
        } else {
            if (!Array.isArray(req.body)) {
                let ${modelName} = await ${modelName.capitalize()}.findById(req.body._id)
                if (!${modelName}) throw { status: 404, message: '${modelName.capitalize()} no found.' }
    
                ${modelName} = Object.assign(${modelName}, req.body)
                ${modelName} = await ${modelName}.save()
                res.status(200).send(${modelName})
            } else {
                const promises = req.body.map(async (item) => {
                    let ${modelName} = await ${modelName.capitalize()}.findById(item._id)
                    if (!${modelName}) throw { status: 404, message: \`The ${modelName} \${item._id} was not found.\` }
    
                    ${modelName} = Object.assign(${modelName}, item)
                    return ${modelName}.save()
                })
    
                const ${modelName}_list = await Promise.all(promises)
                res.status(200).send(${modelName}_list)
            }
        }
    } catch (error) {
        console.log(error)
        next(errMsgHelper.buildError(error))
    }
}

async function remove(req, res, next) {
    try {
        if (!Object.keys(req.query).length) throw { status: 400, message: 'Query params must be declared.' }

        const query = mongoQuery.buildJsonQuery(req.query, 'find', schema(), '${modelName}')
        const ${modelName}_list = await ${modelName.capitalize()}.remove(query)

        res.status(204).send(${modelName}_list)
    } catch (error) {
        console.log(error)
        next(errMsgHelper.buildError(error))
    }
}

function getSchema(req, res, next) {
    res.status(200).send(schema())
}

function schema() {
    return {
        ${buildSchema(model)}
    }
}

module.exports = {
    add,
    selectById,
    list,
    update,
    remove,
    getSchema
}`

    return template
}

module.exports = content