function content() {
    let template = `const { validationResult } = require('express-validator')

function buildError(error) {
    let obj = {
        body: { errors: [] }
    }

    let err = {
        msg: error.message || 'Internal service error, please contact the administrator.'
    }
    
    // Unique constraint
    if (error.code && error.code == 11000) {
        const field = Object.keys(error.keyValue)[0]
        
        err.value = error.keyValue[field]
        err.msg = 'Unique field.'
        err.param = field
        err.location = 'body'
    }

    obj.body.errors.push(err)

    return obj
}

const validationResultExpress = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    next()
}

module.exports = {
    buildError,
    validationResultExpress
}`

    return template
}

module.exports = content