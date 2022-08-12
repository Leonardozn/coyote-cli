function content(authType) {
    const template = `const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../config/app')
const utils = require('../controllers/utils')

function session(req, res, next) {
    if (req.path.indexOf('/auth/login') == -1 && req.path.indexOf('/auth/refresh') == -1) {
        if (${authType == 'cookies' ? 'req.cookies' : 'req.headers.authorization'}) {
            const token = ${authType == 'cookies' ? 'req.cookies.token' : "req.headers.authorization.split(' ')[1]"}
            
            jwt.verify(token, config.ACCESS_TOKEN_SECRET, async (err, decode) => {
                if (err) return res.status(400).send({ status: 400, errors: utils.buildError({ status: 400, message: 'Invalid token' }).body.errors })

                let permission = false
                const user = await User.findOne({ _id: decode.id }).populate({ path: 'role', select: '-__v' })
                user.role.permissions.forEach(url => {
                    if (req.path.indexOf(url) > -1) permission = true
                })

                if (permission) {
                    next()
                } else {
                    return res.status(403).send({ status: 403, errors: utils.buildError({ status: 403, message: 'This user is not authorized to perform the operation' }).body.errors })
                }
            })
        } else {
            return res.status(401).send({ status: 401, errors: utils.buildError({ status: 400, message: 'Unauthorized user' }).body.errors })
        }
    } else {
        next()
    }
}

module.exports = session`

    return template
}

module.exports = content