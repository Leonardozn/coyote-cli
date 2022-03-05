function content() {
    const template = `const User = require('../models/user')
const Role = require('../models/role')
const { Op } = require('sequelize')
const utils = require('./utils')
const config = require('../config/app')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const Joi = require('joi')

function login(req, res, next) {
    User.findAll({ 
        where: {
            [Op.or]: [{ username: req.body.username }, { email: req.body.username }]
        }, 
        include: { model: Role, as: 'user_roleId' }
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
                    role: user.user_roleId.id,
                    roleName: user.user_roleId.name,
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
        const refreshToken = req.body.refreshToken

        jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decode) => {
            if (err) {
                throw new utils.apiError(401, 'Invalid token')
            } else {
                User.findAll({ where: { email: decode.email }, include: { model: Role, as: 'user_roleId' } })
                .then(users => {
                    const user = users[0]

                    const payload = {
                        name: user.username,
                        email: user.email,
                        role: user.user_roleId.id,
                        roleName: user.user_roleId.name,
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

function sendEmail(email, subject, link) {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: parseInt(config.EMAIL_PORT),
            secure: true,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        transporter.sendMail({
            from: \`\${config.EMAIL_USER} Forgot password\`,
            to: email,
            subject: subject,
            html: \`<div><b>Please go to this link to change your password: </b><br><br><a href="\${link}">Click here!!</a></div>\`,
        })
        .then(() => resolve())
        .catch(err => {
            console.log(err)
            reject(new utils.apiError(400, "email not sent."))
        })
    })
}

async function resetPassword(req, res, next) {
    try {
        const schema = Joi.object({ email: Joi.string().email().required() })
        const { error } = schema.validate(req.body)
        if (error) throw new utils.apiError(400, error.details[0].message)

        const user = await User.findOne({ where: { email: req.body.email } })
        if (!user) throw new utils.apiError(400, "user with given email doesn't exist")
        
        let token = await Token.findOne({ where: { userId: user.id } })
        if (!token) {
            const randomText = await utils.encryptPwd(utils.makeid(10))
            token = await Token.create({ userId: user.id, token: randomText })
        }

        const link = \`\${config.BASE_URL}/password-reset/\${user.id}/\${token.token}\`

        sendEmail(user.email, "Password reset", link)
        .then(() => res.status(200).send("password reset link sent to your email account"))
        .catch(err => next(err))
    } catch (error) {
        console.log(error)
        next(error)
    }
}

async function confirmResetPassword(req, res, next) {
    try {
        const schema = Joi.object({ password: Joi.string().required() })
        const { error } = schema.validate(req.body)
        if (error) throw new utils.apiError(400, error.details[0].message)

        const user = await User.findByPk(req.params.userId)
        if (!user) throw new utils.apiError(400, "invalid link or expired.")

        const token = await Token.findOne({ where: { userId: user.id, token: req.params.token } })
        if (!token) throw new utils.apiError(400, "invalid link or expired.")

        await User.update({ password: req.body.password }, { where: { id: req.params.userId } })
        await Token.destroy({ where: { token: req.params.token } })

        res.status(200).send("password reset sucessfully!!")
    } catch (error) {
        next(error)
    }
}

module.exports = {
    login,
    refresh,
    resetPassword,
    confirmResetPassword
}`
    return template
}

module.exports = content