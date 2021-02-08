function content() {
    const template = `const mongoose = require('mongoose')

function closeConnection(req, res, next) {
    mongoose.disconnect()
    next()
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

function jsonCheck(text) {
    if (/^[\\],:{}\\s]*$/.test(text.replace(/\\\\["\\\\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\\\\n\\r]*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\\s*\\[)+/g, ''))) {

        return true

    }

    return false
}

function buildJsonQuery(key, value) {
    let query = {}

    Object.keys(value).forEach(attr => query[\`\${key}.\${attr}\`] = value[attr])
    
    return query
}

module.exports = {
    closeConnection,
    errorMessage,
    apiError,
    getLocalDate,
    jsonCheck,
    buildJsonQuery
}
    `
    return template
}

module.exports = content