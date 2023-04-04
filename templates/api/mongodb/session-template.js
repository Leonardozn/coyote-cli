function content(authType) {
    const template = `const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../config/app')
const errMsgHelper = require('../helpers/errorMessages')

function session(req, res, next) {
\tif (req.path.indexOf('/auth/login') == -1${authType == 'cookies' ? ` && req.path.indexOf('/auth/refresh') == -1` : ''}) {
\t\tif (${authType == 'cookies' ? 'req.cookies' : `req.headers.authorization && req.headers.authorization.split(' ')[0] == 'Bearer'`}) {
\t\t\tconst token = ${authType == 'cookies' ? 'req.cookies.token' : "req.headers.authorization.split(' ')[1]"}
            
\t\t\tjwt.verify(token, config.ACCESS_TOKEN_SECRET, async (err, decode) => {
\t\t\t\tif (err) return res.status(400).send(errMsgHelper.buildError({ status: 400, message: 'Invalid token' }))

\t\t\t\tlet permission = false
\t\t\t\tconst user = await User.findOne({ _id: decode.id }).populate({ path: 'role', select: '-__v' })
\t\t\t\tuser.role.permissions.forEach(url => {
\t\t\t\t\tif (req.path.indexOf(url) > -1) permission = true
\t\t\t\t})

\t\t\t\tif (permission) {
\t\t\t\t\tnext()
\t\t\t\t} else {
\t\t\t\t\treturn res.status(403).send(errMsgHelper.buildError({ status: 403, message: 'This user is not authorized to perform the operation' }))
\t\t\t\t}
\t\t\t})
\t\t} else {
\t\t\treturn res.status(401).send(errMsgHelper.buildError({ status: 401, message: 'Unauthorized user' }))
\t\t}
\t} else {
\t\tnext()
\t}
}

module.exports = session`

    return template
}

module.exports = content