const fs = require('fs')

function content() {
    let settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
    let settings = JSON.parse(settingContent)

    let template = `const Permissions = require('../models/permissions')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../config/app')

function session(req, res, next) {
    if (req.path.indexOf('/auth/login') == -1 && req.path.indexOf('/auth/refresh') == -1) {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1]
            
            jwt.verify(token, config.ACCESS_TOKEN_SECRET, async (err, decode) => {
                if (err) return res.status(401).send({message: 'Invalid token'})

                let permission = false

                const permissions = await Permissions.findAll({ where: { role: decode.role } })

                if (req.headers.navigation) {
                    permission = true
                } else if (permissions.length) {
                    permissions.forEach(obj => {
                        if (req.path.indexOf(obj.path) > -1) permission = true
                    })
                }

                if (permission) {\n`
                    
    if (settings.authenticationApp) {
        template += `\t\t\t\t\tconst user = await User.findByPk(decode.id)
                    req.user = user\n`
    }

    template += `\t\t\t\t\tnext()
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