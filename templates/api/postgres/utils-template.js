function content() {
    const template = `const { Sequelize } = require('../modules/pgConnection')

function closeConnection(req, res, next) {
    pgConnection.close()
    .then(() => next())
    .catch(err => next(err))
}

function errorMessage(err) {
    let error = {
        status: err.status || 500,
        message: err.message || 'Error interno del servicio, por favor comuniquese con el administrador'
    }
    
    return error
}

function apiError(status, message) {
    this.name = 'Api error'
    this.status = status
    this.message = message
}

apiError.prototype = Error.prototype

function getLocalDate() {
    const date = new Date()
    const localDate = \`\${date.getFullYear()}-\${date.getMonth()+1}-\${date.getDate()} \${date.getHours()}:\${date.getMinutes()}:\${date.getSeconds()} UTC\`
    
    return new Date(localDate)
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = {
    closeConnection,
    errorMessage,
    apiError,
    getLocalDate
}
    `
    return template
}

module.exports = content