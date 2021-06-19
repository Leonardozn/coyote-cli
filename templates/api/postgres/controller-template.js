const utils = require('../../../controllers/utils')

function content(model, models) {
    let template = `const ${model.capitalize()} = require('../models/${model}')\n`
    let refShowModel = []
    let modelShowoRef = []

    if (models[model].foreignKeys) {
        models[model].foreignKeys.forEach(fk => {
            if (fk.showModelInfo) refShowModel.push(fk.name)
        })
    }

    if (models[model].showRelationInfo) {
        models[model].showRelationInfo.forEach(ref => modelShowoRef.push(ref))
    }

    refShowModel.forEach(ref => template += `const ${ref.capitalize()} = require('../models/${ref}')\n`)
    modelShowoRef.forEach(ref => template += `const ${ref.capitalize()} = require('../models/${ref}')\n`)
    
    template += `const utils = require('./utils')
const { Op } = require('sequelize')
const virtuals = require('../models/fields.virtuals')

function add(req, res, next) {
    ${model.capitalize()}.create(req.body)
    .then(${model} => res.status(201).send({ data: ${model} }))
    .catch(err => next(err))
}

function selectById(req, res, next) {
    ${model.capitalize()}.findByPk(req.params.id)
    .then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model} no found')
        res.status(200).send({ data: ${model} })
    })
    .catch(err => next(err))
}

function list(req, res, next) {
    let query = {
        attributes: virtuals.${model}_fields,\n`

    const refList = refShowModel.concat(modelShowoRef)

    if (refList.length) template += `        include: [\n`

    refList.forEach((ref, i) => {
        template += `            {
                model: ${ref.capitalize()},
                attributes: virtuals.${ref}_fields
            }`

        if (i < refList.length - 1) template += ','
        
        template += '\n'

        if (i == refList.length - 1) template += `        ]\n`
    })

    template += `    }
    
    if (Object.keys(req.query).length) {
        query['where'] = {}

        Object.keys(req.query).forEach(key => {
            if (key == 'name') {
                if (Array.isArray(req.query[key])) {
                    query['where'][key] = req.query[key]
                } else {
                    query['where'][key] = { [Op.iLike]: \`%\${req.query[key]}%\` }
                }
            } else {
                query['where'][key] = req.query[key]
            }
        })
        
        ${model.capitalize()}.findAll(query)\n`

        if (models[model].activatedSchema) {
            template += `        .then(${model}_list => res.status(200).send({ schema: schemaDesc(), amount: ${model}_list.length, data: ${model}_list }))\n`
        } else {
            template += `        .then(${model}_list => res.status(200).send({ data: ${model}_list }))\n`
        }

        template += `        .catch(err => next(err))
    } else {
        ${model.capitalize()}.findAll(query)\n`

        if (models[model].activatedSchema) {
            template += `        .then(${model}_list => res.status(200).send({ schema: schemaDesc(), amount: ${model}_list.length, data: ${model}_list }))\n`
        } else {
            template += `        .then(${model}_list => res.status(200).send({ data: ${model}_list }))\n`
        }

        template += `        .catch(err => next(err))
    }
}

function update(req, res, next) {
    const {id, ...body} = req.body

    ${model.capitalize()}.update(body, {
        where: {
            id: req.body.id
        }
    })
    .then(${model} => res.status(200).send({ data: ${model} }))
    .catch(err => next(err))
}\n`

    if (models[model].activatedSchema) {
        template += `\nfunction options(req, res, next) {
    res.status(200).send({ data: schemaDesc() })
}
        
function schemaDesc() {
    const schemaDesc = {\n`

        models[model].fields.forEach((field, i) => {
            if (i == models[model].fields.length - 1) {
                template += `        ${field.name}: { type: '${field.type}', label: '${field.label}' }\n`
            } else {
                template += `        ${field.name}: { type: '${field.type}', label: '${field.label}' },\n`
            }
        })

        template += `
    }
}\n`
    }

    template += `\nmodule.exports = {
    add,
    selectById,
    list,
    ${models[model].activatedSchema && 'options,'}
    update
}
    `

    return template
}

module.exports = content