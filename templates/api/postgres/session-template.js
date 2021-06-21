function content() {
    const template = `const User = require('../models/user')
const Role = require('../models/role')
const Permissions = require('../models/permissions')
const jwt = require('jsonwebtoken')
const config = require('../config/app')
const utils = require('../controllers/utils')

function session(req, res, next) {
    if (req.path.indexOf('/auth/login') == -1 && req.path.indexOf('/auth/refresh') == -1) {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1]
            
            jwt.verify(token, config.ACCESS_TOKEN_SECRET, async (err, decode) => {
                if (err) return res.status(401).send({message: 'Invalid token'})

                let permission = false
                const users = await User.findAll({
                    where: { email: decode.email },
                    include: { model: Role, include: Permissions }
                })

                if (users[0].role.permission.length) {
                    users[0].role.permission.forEach(obj => {
                        if (req.path.indexOf(obj.path) > -1) permission = true
                    })
                } else {
                    if (users[0].role.permission.path) {
                        if (req.path.indexOf(users[0].role.permission.path) > -1) permission = true
                    }
                }

                if (permission) {
                    next()
                } else {
                    return res.status(401).send({message: 'This user is not authorized to perform the operation'})
                }
            })
        } else {
            return res.status(401).send({message: 'Unauthorized user'})
        }
    } else {
        next()
    }
}

module.exports = session`

    return template
}

module.exports = content