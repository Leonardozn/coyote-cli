const utils = require('../../../controllers/utils')

function content(model) {
    let template = `const ${model.capitalize()} = require('../models/${model}')
const utils = require('./utils')
const { Op } = require('sequelize')

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
    if (Object.keys(req.query).length) {
        let query = { where: {} }

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
        
        ${model.capitalize()}.findAll(query)
        .then(${model}_list => res.status(200).send({ data: ${model}_list }))
        .catch(err => next(err))
    } else {
        ${model.capitalize()}.findAll()
        .then(${model}_list => res.status(200).send({ data: ${model}_list }))
        .catch(err => next(err))
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
}

module.exports = {
    add,
    selectById,
    list,
    update
}
    `

    return template
}

module.exports = content