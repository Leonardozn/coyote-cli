function content() {
    let template = `const bcrypt = require('bcrypt')

function encryptPwd(password) {
\treturn new Promise((resolve, reject) => {
\t\tbcrypt.hash(password, 10, (err, hash) => {
\tif (err) return reject({status: 500, message: err.message})
\treturn resolve(hash)
\t\t})
\t})
}

function verifyPwd(password, hash) {
\treturn new Promise((resolve, reject) => {
\t\tbcrypt.compare(password, hash, (err, result) => {
\t\t\tif (err) return reject({status: 500, message: err.message})
\t\t\treturn resolve(result)
\t\t})
\t})
}

module.exports = {
\tencryptPwd,
\tverifyPwd
}`

    return template
}

module.exports = content