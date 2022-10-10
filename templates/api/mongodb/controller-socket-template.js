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

async function add(io, body) {
    try {
        if (!Array.isArray(body)) {
            let ${modelName} = new ${modelName.capitalize()}(body)
            ${modelName} = await ${modelName}.save()
            io.emit('back:${modelName}:add', ${modelName}_list)
        } else {
            const ${modelName}_list = await ${modelName.capitalize()}.insertMany(body)
            io.emit('back:${modelName}:add', ${modelName}_list)
        }
    } catch (error) {
        io.emit('back:error', errMsgHelper.buildError(error))
    }
}

async function selectById(socket, id) {
    try {
        const ${modelName} = await ${modelName.capitalize()}.findById(id)
        if (!${modelName}) throw { message: '${modelName.capitalize()} no found.' }

        socket.emit('back:${modelName}:select', ${modelName})
    } catch (error) {
        socket.emit('back:error', errMsgHelper.buildError(error))
    }
}

async function list(socket, body) {
    try {
        const query = mongoQuery.buildJsonQuery(body.query, 'aggregate', schema())
        const ${modelName}_list = await ${modelName.capitalize()}.aggregate(query)
        socket.emit('back:${modelName}:list', ${modelName}_list)
    } catch (error) {
        socket.emit('back:error', errMsgHelper.buildError(error))
    }
}

async function update(io, body) {
    try {
        if (Object.keys(body.query).length) {
            const query = mongoQuery.buildJsonQuery(body.query, 'find', schema())
            const results = await ${modelName.capitalize()}.find(query)
            let promises = []
            let modify = body
            if (Array.isArray(modify)) modify = modify[modify.length-1]

            for (let item of results) {
                item = Object.assign(item, modify)
                promises.push(item.save())
            }

            let ${modelName}_list = []
            if (promises.length) ${modelName}_list = await Promise.all(promises)

            io.emit('back:${modelName}:update', ${modelName}_list)
        } else {
            if (!Array.isArray(body)) {
                let ${modelName} = await ${modelName.capitalize()}.findById(body._id)
                if (!${modelName}) throw { message: '${modelName.capitalize()} no found.' }
    
                ${modelName} = Object.assign(${modelName}, body)
                ${modelName} = await ${modelName}.save()
                io.emit('back:${modelName}:update', ${modelName})
            } else {
                let promises = []
                for (let item of body) {
                    let ${modelName} = await ${modelName.capitalize()}.findById(item._id)
                    if (!${modelName}) throw { message: \`The ${modelName} \${item._id} was not found.\` }
    
                    ${modelName} = Object.assign(${modelName}, item)
                    promises.push(${modelName}.save())
                }
    
                const ${modelName}_list = await Promise.all(promises)
                io.emit('back:${modelName}:update', ${modelName}_list)
            }
        }
    } catch (error) {
        io.emit('back:error', errMsgHelper.buildError(error))
    }
}

async function remove(io, body) {
    try {
        if (!Object.keys(body.query).length) throw { message: 'Query params must be declared.' }

        const query = mongoQuery.buildJsonQuery(body.query, 'find', schema(), '${modelName}')
        const ${modelName}_list = await ${modelName.capitalize()}.remove(query)

        io.emit('back:${modelName}:remove', ${modelName}_list)
    } catch (error) {
        io.emit('back:error', errMsgHelper.buildError(error))
    }
}

function getSchema(io) {
    io.emit('back:product:schema', schema())
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