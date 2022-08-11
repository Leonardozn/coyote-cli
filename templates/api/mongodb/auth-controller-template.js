function content(authType) {
    let template = `const User = require('../models/user')
const utils = require('./utils')
const config = require('../config/app')
const jwt = require('jsonwebtoken')

function login(req, res, next) {
    User.findOne({ $or: [{username: req.body.username}, {email: req.body.username}] })
    .then(user => {
        if(!user) throw { status: 401, message: 'Unregistered email or username' }
        
        utils.verifyPwd(req.body.password, user.password)
        .then(match => {
            if (match) {
                const payload = {
                    name: user.first_name,
                    email: user.email,
                    role: user.role._id,
                    id: user._id
                }

                const refresh_info = { email: user.email }
                
                jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: ${authType == 'cookies' ? "'15m'" : "'20s'"} }, async (err, token) => {
                    if (err) throw { status: 400, message: err.message }\n\n`

    if (authType == 'cookies') {
        template += `\t\t\t\t\tjwt.sign(refresh_info, config.REFRESH_TOKEN_SECRET, { expiresIn: '16h' }, (refErr, refreshToken) => {
                        if (refErr) throw { status: 400, message: refErr.message }

                        res.cookie('token', token, { httpOnly: true, secure: !(config.MODE) })
                        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: !(config.MODE) })
                        res.status(200).send({ token, refreshToken })
                    })`
    } else {
        template += '\t\t\t\t\tres.status(200).send({ token })'
    }
            
    template += `\n\t\t\t\t})
            } else {
                throw { status: 400, message: 'Wrong password' }
            }
        })
        .catch(err => next(utils.buildError(err)))
    })
    .catch(err => next(utils.buildError(err)))
}`

    if (authType == 'cookies') {
        template += `\n\nfunction refresh(req, res, next) {
            if (req.cookies) {
                const refreshToken = req.cookies.refreshToken
        
                jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decode) => {
                    if (err) {
                        throw { status: 401, message: 'Invalid token' }
                    } else {
                        User.findOne({email: decode.email})
                        .then(user => {
                            const payload = {
                                name: user.first_name,
                                email: user.email,
                                role: user.role._id,
                                id: user._id
                            }
                            
                            jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: '15m' }, (tokenErr, token) => {
                                if (tokenErr) throw { status: 500, message: tokenErr.message }
                                
                                res.cookie('token', token, { httpOnly: true, secure: !(config.MODE) })
                                res.status(200).send({token: token})
                            })
                        })
                        .catch(err => next(utils.buildError(err)))
                    }
                })
            }
        }`
    }

     template += `\n\nmodule.exports = {
    login,
    refresh
}
    `
    return template
}

module.exports = content