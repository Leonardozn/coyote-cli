function content() {
    let template = `const mongoose = require('mongoose')

function closeConnection(req, res, next) {
    mongoose.disconnect()
    next()
}

module.exports = {
    closeConnection
}`

    return template
}

module.exports = content