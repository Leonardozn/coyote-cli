const utils = require('../../../controllers/utils')

function content(model, list) {
    let template = `const ${model.capitalize()} = require('../models/${model}')
const utils = require('./utils')

function add(req, res, next) {
    req.body.created = utils.getLocalDate()
    const ${model} = new ${model.capitalize()}(req.body)
    ${model}.save().then(_${model} => res.status(201).send({data: _${model}.view}))
    .catch(err => next(err))
}

function selectById(req, res, next) {
    ${model.capitalize()}.findOne({_id: req.params.id})\n`

    list.forEach(field => {
        if (field.ref) template += `    .populate({ path: '${field.ref}', select: '-__v' })\n`
    })

    template += `    .then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model.capitalize()} no found')
        res.status(200).send({data: ${model}.view})
    })
    .catch(err => next(err))
}

function list(req, res, next) {
    let query = {}
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (utils.jsonCheck(req.query[key])) {
                query = utils.buildJsonQuery(key, JSON.parse(req.query[key]))
            } else if (key == 'name') {
                query[key] = { $regex: req.query[key] }
            } else {
                query[key] = req.query[key]
            }
        })
    }
    
    ${model.capitalize()}.find(query)\n`

    list.forEach(field => {
        if (field.ref) template += `    .populate({ path: '${field.ref}', select: '-__v' })\n`
    })

    template += `    .then(list => {
        let ${model}_list = []
        list.forEach(${model} => ${model}_list.push(${model}.view))
        res.status(200).send({data: ${model}_list})
    })
    .catch(err => next(err))
}

function update(req, res, next) {
    ${model.capitalize()}.findOne({_id: req.body._id})
    .then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model.capitalize()} no found')
        Object.assign(${model}, req.body)
        ${model}.save().then(_${model} => res.status(200).send({data: _${model}.view}))
    })
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