const utils = require('../../../controllers/utils')

function content(model) {
    let template = `const ${model.capitalize()} = require('../models/${model}')
const utils = require('./utils')
const mongoQuery = require('./mongo-query')

async function add(req, res, next) {
    try {
        if (!Array.isArray(req.body)) {
            let ${model} = new ${model.capitalize()}(req.body)
            ${model} = await ${model}.save()
            res.status(201).send(${model})
        } else {
            const ${model}_list = await ${model.capitalize()}.insertMany(req.body)
            res.status(201).send(${model}_list)
        }
    } catch (error) {
        next(utils.buildError(error))
    }
}

async function selectById(req, res, next) {
    try {
        const ${model} = await ${model.capitalize()}.findById(req.params.id)
        if (!${model}) throw { status: 404, message: '${model.capitalize()} no found.' }

        res.status(200).send(${model})
    } catch (error) {
        next(utils.buildError(error))
    }
}

async function list(req, res, next) {
    try {
        const query = mongoQuery.buildJsonQuery(req.query, 'aggregate', schema())
        const ${model}_list = await ${model.capitalize()}.aggregate(query)
        res.status(200).send({ amount: ${model}_list.length, data: ${model}_list })
    } catch (error) {
        next(utils.buildError(error))
    }
}

async function update(req, res, next) {
    try {
        if (Object.keys(req.query).length) {
            const query = mongoQuery.buildJsonQuery(req.query, 'find', schema())
            const results = await ${model.capitalize()}.find(query)
            let promises = []
            let modify = req.body
            if (Array.isArray(modify)) modify = modify[modify.length-1]

            for (let item of results) {
                item = Object.assign(item, modify)
                promises.push(item.save())
            }

            let ${model}_list = []
            if (promises.length) ${model}_list = await Promise.all(promises)

            res.status(200).send(${model}_list)
        } else {
            if (!Array.isArray(req.body)) {
                let ${model} = await ${model.capitalize()}.findById(req.body._id)
                if (!${model}) throw { status: 404, message: '${model.capitalize()} no found.' }
    
                ${model} = Object.assign(${model}, req.body)
                ${model} = await ${model}.save()
                res.status(200).send(${model})
            } else {
                let promises = []
                for (let item of req.body) {
                    let ${model} = await ${model.capitalize()}.findById(item._id)
                    if (!${model}) throw { status: 404, message: \`The ${model} \${item._id} was not found.\` }
    
                    ${model} = Object.assign(${model}, item)
                    promises.push(${model}.save())
                }
    
                const ${model}_list = await Promise.all(promises)
                res.status(200).send(${model}_list)
            }
        }
    } catch (error) {
        next(utils.buildError(error))
    }
}

async function remove(req, res, next) {
    try {
        if (!Object.keys(req.query).length) throw { status: 400, message: 'Query params must be declared.' }

        const query = mongoQuery.buildJsonQuery(req.query, 'find', schema())
        const ${model}_list = await ${model.capitalize()}.remove(query)

        res.status(204).send(${model}_list)
    } catch (error) {
        next(utils.buildError(error))
    }
}

function getSchema(req, res, next) {
    res.status(200).send(schema())
}

function schema() {
    return {
        item: { type: 'String' },
        description: { type: 'String' },
        category: { type: 'String' },
        qty: { type: 'Number' },
        arrival: { type: 'Date' }
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