function content() {
    const template = `const User = require('../models/user')
const Role = require('../models/role')
const { Op } = require('sequelize')
const utils = require('./utils')
const config = require('../config/app')
const jwt = require('jsonwebtoken')

function login(req, res, next) {
    User.findAll({ 
        where: {
            [Op.or]: [{ username: req.body.username }, { email: req.body.username }]
        }, 
        include: { model: Role, as: 'roleId' }
    })
    .then(users => {
        if(!users.length) throw new utils.apiError(400, 'Unregistered email or username')

        const user = users[0]
        
        utils.verifyPwd(req.body.password, user.password)
        .then(match => {
            if (match) {
                const payload = {
                    name: user.username,
                    email: user.email,
                    role: user.role.name,
                    id: user.id
                }

                const refresh_info = { email: user.email }
                
                jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {expiresIn: '15m'}, async (err, token) => {
                    if (err) throw new utils.apiError(500, err.message)

                    jwt.sign(refresh_info, config.REFRESH_TOKEN_SECRET, {expiresIn: '16h'}, (refErr, refreshToken) => {
                        if (refErr) throw new utils.apiError(500, refErr.message)

                        res.status(200).send({token: token, refreshToken: refreshToken})
                    })
                })
            } else {
                throw new utils.apiError(400, 'Wrong password')
            }
        })
        .catch(err => next(err))
    })
    .catch(err => next(err))
}

function refresh(req, res, next) {
    if (req.body.refreshToken) {
        const refreshToken = req.body.refreshToken.split(' ')[1]

        jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decode) => {
            if (err) {
                new utils.apiError(401, 'Invalid token')
            } else {
                User.findAll({ where: { email: decode.email } })
                .then(users => {
                    const user = users[0]

                    const payload = {
                        name: user.username,
                        email: user.email,
                        role: user.role.name,
                        id: user.id
                    }
                    
                    jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {expiresIn: '15m'}, (tokenErr, token) => {
                        if (tokenErr) throw new utils.apiError(500, tokenErr.message)
                        
                        res.status(200).send({token: token})
                    })
                })
                .catch(err => next(err))
            }
        })
    }
}

module.exports = {
    login,
    refresh
}
    `
    return template
}

module.exports = content