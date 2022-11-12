function content() {
    let template = `function buildError(error) {
    let obj = {
        status: error.status || 500,
        message: error.message || 'Internal service error, please contact the administrator.',
        item: error.item || null
    }
    
    // Unique constraint
    if (error.code && error.code == 11000) {
        const field = Object.keys(error.keyValue)[0]
        
        obj.status = 400
        obj.message = \`Unique field: The value of "\${field}" field already exist.\`
        obj.item = error.keyValue
    }

    return obj
}

module.exports = {
    buildError
}`

    return template
}

module.exports = content