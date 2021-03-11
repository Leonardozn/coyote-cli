function content() {
    const template = `const User = require('../models/user')
const utils = require('./utils')
const config = require('../config/app')
const jwt = require('jsonwebtoken')

function login(req, res, next) {
    User.findOne({email: req.body.email})
    .then(user => {
        if(!user) throw new utils.apiError(400, 'Este email no está registrado')
        
        utils.verifyPwd(req.body.password, user.password)
        .then(match => {
            if (match) {
                const payload = {
                    name: user.first_name,
                    email: user.email,
                    role: user.role,
                    id: user._id
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
                throw new utils.apiError(400, 'Contraseña errada')
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
                new utils.apiError(401, 'Token no valido')
            } else {
                User.findOne({email: decode.email})
                .then(user => {
                    const payload = {
                        name: user.first_name,
                        email: user.email,
                        role: user.role,
                        id: user._id
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