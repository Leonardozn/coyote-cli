const utils = require('../../../controllers/utils')

function content() {
    let template = `const Role = require('../models/role')
const Permissions = require('../models/permissions')
const utils = require('./utils')
const { Op } = require('sequelize')

function add(req, res, next) {
    Role.create(req.body)
    .then(role => res.status(201).send({ data: role }))
    .catch(err => next(err))
}

function selectById(req, res, next) {
    Role.findByPk(req.params.id)
    .then(role => {
        if (!role) throw new utils.apiError(400, 'role no found')
        res.status(200).send({ data: role })
    })
    .catch(err => next(err))
}

function list(req, res, next) {
    if (Object.keys(req.query).length) {
        let query = { where: {}, include: Permissions }

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
        
        Role.findAll(query)
        .then(role_list => res.status(200).send({ data: role_list }))
        .catch(err => next(err))
    } else {
        Role.findAll({ include: Permissions })
        .then(role_list => res.status(200).send({ data: role_list }))
        .catch(err => next(err))
    }
}

function update(req, res, next) {
    const {id, ...body} = req.body

    Role.update(body, {
        where: {
            id: req.body.id
        }
    })
    .then(role => res.status(200).send({ data: role }))
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