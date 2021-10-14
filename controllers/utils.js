const bcrypt = require('bcrypt')

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

function encryptPwd(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return reject({status: 500, message: err.message})
            return resolve(hash)
        })
    })
}

function aliasName(alias) {
    let as = alias
    let chars = as.split('')

    if (chars[chars.length-2] == 'I' && chars[chars.length-1] == 'd') {
        chars.splice(chars.length-1, 1)
        chars.splice(chars.length-1, 1)
        as = chars.join('')
    } else {
        as += 'Id'
    }

    return as
}

module.exports = {
    encryptPwd,
    aliasName
}