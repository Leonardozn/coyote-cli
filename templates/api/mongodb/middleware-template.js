function buildArrayStructure(field, spaces) {
    let jump = false
    if (field.contentType == 'Object') jump = true

    let template = `Joi.array().items(${jump ? `\n${spaces}` : ''}`

    if (field.contentType == 'String' || field.contentType == 'ObjectId') template += `Joi.string()`
    if (field.contentType == 'Number') template += `Joi.number()`
    if (field.contentType == 'Boolean') template += `Joi.boolean()`
    if (field.contentType == 'Date') template += `Joi.date()`
    if (field.contentType == 'Object') template += buildObjectStructure(field.structure, `${spaces}\t`, false)

    template += `${jump ? `\n${spaces.substr(0, spaces.length-1)}` : ''})`
    
    return template
}

function buildObjectStructure(fields, spaces, main) {
    let template = `Joi.object({\n${main ? `\t\t_id: Joi.string().allow(null).allow(""),\n` : ''}`

    Object.keys(fields).forEach((key, i) => {
        const field = fields[key]
        template += `${spaces}${key}: `
        
        if (field.type == 'String' || field.type == 'ObjectId') template += `Joi.string()`
        if (field.type == 'Number') template += `Joi.number()`
        if (field.type == 'Boolean') template += `Joi.boolean()`
        if (field.type == 'Date') template += `Joi.date()`
        if (field.type == 'Object') template += buildObjectStructure(field.structure, `${spaces}\t`, false)
        if (field.type == 'Array') template += buildArrayStructure(field, `${spaces}\t`)

        if (field.isEmail) template += `.email()`

        if (field.unique || field.required) {
            template += `.required()`
        } else {
            if (field.type == 'String' || field.type == 'ObjectId' || field.type == 'Date') template += `.allow(null).allow("")`
            if (field.type == 'Number') template += `.allow(null)`
        }

        if (i < Object.keys(fields).length - 1) template += `,\n`
    })
    
    template += `\n${spaces.substr(0, spaces.length-1)}})`

    return template
}

function content(model) {
    let template = `const Joi = require('joi')
const errorMessages = require('../helpers/errorMessages')

function validationSchema(req, res, next) {
\tconst schema = ${buildObjectStructure(model.fields, '\t\t', true)}`
    
    template += `\n\n\ttry {
\t\tif (Array.isArray(req.body)) {
\t\t\tfor (let item of req.body) {
\t\t\t\tconst { error, value } = schema.validate(item)
\t\t\t\tif (error) throw { status: 400, message: error.details[0].message, item: value }
\t\t\t}
\t\t} else {
\t\t\tconst { error, value } = schema.validate(req.body)
\t\t\tif (error) throw { status: 400, message: error.details[0].message, item: value }
\t\t}

\t\tnext()
\t} catch (error) {
\t\tconsole.log(error)
\t\tres.status(400).send(errorMessages.buildError(error))
\t}
}

module.exports = validationSchema`

    return template
}

module.exports = content