function content(authType) {
    let template = `const User = require('../models/user')
const encryptHelper = require('../helpers/encrypt')
const errMsgHelper = require('../helpers/errorMessages')
const config = require('../config/app')
const jwt = require('jsonwebtoken')

function login(req, res, next) {
\tUser.findOne({ $or: [{username: req.body.username}, {email: req.body.username}] })
\t.select({ first_name: 1, last_name: 1, username: 1, email: 1, password: 1, role: 1 })
\t.then(user => {
\t\tif(!user) throw { status: 401, message: 'Wrong username or password' }
        
\t\tencryptHelper.verifyPwd(req.body.password, user.password)
\t\t.then(match => {
\t\t\tif (match) {
\t\t\t\tconst payload = {
\t\t\t\t\tname: user.first_name,
\t\t\t\t\temail: user.email,
\t\t\t\t\trole: user.role,
\t\t\t\t\tid: user._id
\t\t\t\t}
\t\t\t\t${authType == 'cookies' ? `\n\t\t\t\tconst refresh_info = { email: user.email }\n` : ''}
\t\t\t\tjwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: ${authType == 'cookies' ? "'15m'" : "'20s'"} }, async (err, token) => {
\t\t\t\t\tif (err) throw { status: 400, message: err.message }\n\n`

    if (authType == 'cookies') {
        template += `\t\t\t\t\tjwt.sign(refresh_info, config.REFRESH_TOKEN_SECRET, (refErr, refreshToken) => {
\t\t\t\t\t\tif (refErr) throw { status: 400, message: refErr.message }

\t\t\t\t\t\tres.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'None' })
\t\t\t\t\t\tres.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'None' })
\t\t\t\t\t\tres.status(200).json({ token })
\t\t\t\t\t})`
    } else {
        template += '\t\t\t\t\tres.status(200).json({ token })'
    }
            
    template += `\n\t\t\t\t})
\t\t\t} else {
\t\t\t\tthrow { status: 400, message: 'Wrong username or password' }
\t\t\t}
\t\t})
\t\t.catch(err => {
\t\t\tconsole.log(err)
\t\t\tnext(errMsgHelper.buildError(err))
\t\t})
\t})
\t.catch(err => {
\t\tconsole.log(err)
\t\tnext(errMsgHelper.buildError(err))
\t})
}`

    if (authType == 'cookies') {
        template += `\n\nfunction refresh(req, res, next) {
\tif (req.cookies) {
\t\tconst refreshToken = req.cookies.refreshToken

\t\tjwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decode) => {
\t\t\tif (err) {
\t\t\t\tthrow { status: 401, message: 'Invalid refreshToken' }
\t\t\t} else {
\t\t\t\tUser.findOne({email: decode.email})
\t\t\t\t.then(user => {
\t\t\t\t\tconst payload = {
\t\t\t\t\t\tname: user.first_name,
\t\t\t\t\t\temail: user.email,
\t\t\t\t\t\trole: user.role,
\t\t\t\t\t\tid: user._id
\t\t\t\t\t}
                    
\t\t\t\t\tjwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: '15m' }, (tokenErr, token) => {
\t\t\t\t\t\tif (tokenErr) throw { status: 500, message: tokenErr.message }
                        
\t\t\t\t\t\tres.cookie('token', token, { httpOnly: true, secure: !(config.MODE) })
\t\t\t\t\t\tres.status(200).json({ token })
\t\t\t\t\t})
\t\t\t\t})
\t\t\t\t.catch(err => next(errMsgHelper.buildError(err)))
\t\t\t}
\t\t})
\t}
}

async function signup(req, res, next) {
\ttry {
\t\treq.body.role = null
\t\tlet user = new User(req.body)
\t\tuser = await user.save()
\t\tres.status(201).json(user)
\t} catch (err) {
\t\tnext(errMsgHelper.buildError(err))
\t}
}

function logout(req, res, next) {
\ttry {
\t\tif (req.cookies) {
\t\t\tres.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'None' })
\t\t\tres.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'None' })
\t\t\tres.status(200).json({ data: 'Logout successfully' })
\t\t} else {
\t\t\tthrow { status: 400, message: 'There is no a current session.' }
\t\t}
\t} catch (err) {
\t\tconsole.log(err)
\t\tnext(errMsgHelper.buildError(err))
\t}
}`
    }

     template += `\n\nmodule.exports = {
\tlogin${authType == 'cookies' ? ',\nrefresh,\nsignup,\nlogout' : ''}
}
    `
    return template
}

module.exports = content