const utils = require('../../../controllers/utils')

function content() {
    let template = `const User = require('../models/user')
const Role = require('../models/role')
const Permissions = require('../models/permissions')
const utils = require('./utils')
const { Op } = require('sequelize')

function add(req, res, next) {
    utils.encryptPwd(req.body.password)
    .then(hash => {
        req.body.password = hash
        User.create(req.body)
        .then(user => res.status(201).send({ data: user }))
        .catch(err => next(err))
    })
    .catch(err => next(err))
}

function selectById(req, res, next) {
    User.findByPk(req.params.id)
    .then(user => {
        if (!user) throw new utils.apiError(400, 'user no found')
        res.status(200).send({ data: user })
    })
    .catch(err => next(err))
}

function list(req, res, next) {
    if (Object.keys(req.query).length) {
        let query = { where: {}, include: { model: Role, include: Permissions } }

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
        
        User.findAll(query)
        .then(user_list => res.status(200).send({ data: user_list }))
        .catch(err => next(err))
    } else {
        User.findAll({ include: { model: Role, include: Permissions } })
        .then(user_list => res.status(200).send({ data: user_list }))
        .catch(err => next(err))
    }
}

function update(req, res, next) {
    const {id, ...body} = req.body

    User.update(body, {
        where: {
            id: req.body.id
        }
    })
    .then(user => res.status(200).send({ data: user }))
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