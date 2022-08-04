function content(model) {
    let template = `const { body } = require('express-validator')
const utils = require('../controllers/utils')

const validationSchema = [`

    for (let field in model.fields) {
        let required = false

        if (model.fields[field].unique || model.fields[field].required) {
            template += `\n\tbody('${field}', 'Required field.')
    .notEmpty(),`

            required = true
        }

        if (model.fields[field].type == 'String' || model.fields[field].type == 'ObjectId') {
            let errorMessage = 'Invalid format: This must be a String value'

            if (model.fields[field].type == 'String') {
                if (model.fields[field].minLen && model.fields[field].maxLen) {
                    errorMessage += ` and contain between ${model.fields[field].minLen} and ${model.fields[field].maxLen} characters`
                } else if (model.fields[field].minLen) {
                    errorMessage += ` and contain ${model.fields[field].minLen} characters at least`
                } else if (model.fields[field].maxLen) {
                    errorMessage += ` and contain maximun ${model.fields[field].maxLen} characters`
                }
            }

            errorMessage += '.'

            template += `\n\tbody('${field}', '${errorMessage}')${!required ? '\n\t.optional({ nullable: true })' : ''}
    .isString()`

            if (model.fields[field].type == 'String') {
                if (model.fields[field].minLen && model.fields[field].maxLen) {
                    template += `\n\t.isLength({ min: ${model.fields[field].minLen}, max: ${model.fields[field].maxLen} })`
                } else if (model.fields[field].minLen) {
                    template += `\n\t.isLength({ min: ${model.fields[field].minLen} })`
                } else if (model.fields[field].maxLen) {
                    template += `\n\t.isLength({ max: ${model.fields[field].maxLen} })`
                }

                if (model.fields[field].trim) template += `\n\t.trim()`
            }

            template += ','
        }

        if (model.fields[field].type == 'Number') {
            template += `\n\tbody('${field}', 'Invalid format: This must be a Numeric value.')${!required ? '\n\t.optional({ nullable: true })' : ''}
    .custom((value, { req }) => {\n`

            if (model.fields[field].min && model.fields[field].max) {
                template += `\t\tif (typeof value == 'number' && (value >= ${model.fields[field].min} && value <= ${model.fields[field].max})) return true`
            } else if (model.fields[field].min) {
                template += `\t\tif (typeof value == 'number' && value >= ${model.fields[field].min}) return true`
            } else if (model.fields[field].max) {
                template += `\t\tif (typeof value == 'number' && value <= ${model.fields[field].max}) return true`
            } else {
                template += `\t\tif (typeof value == 'number') return true`
            }

            template += `\n\t\treturn false
    })`

            template += ','
        }

        if (model.fields[field].type == 'Date') {
            template += `\n\tbody('${field}', 'Invalid format: This must be a (yyyy-mm-dd) date format value.')${!required ? '\n\t.optional({ nullable: true })' : ''}
    .isDate()
    .isISO8601(),`
        }
    }

    template += `\n\tutils.validationResultExpress
]

module.exports = validationSchema`

    return template
}

module.exports = content