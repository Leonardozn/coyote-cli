function content() {
    let template = `const mongoose = require('mongoose')

function closeConnection(req, res, next) {
\tmongoose.disconnect()
\tnext()
}

module.exports = {
\tcloseConnection
}`

    return template
}

module.exports = content