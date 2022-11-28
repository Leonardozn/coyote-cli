function buildArrayStructure(field, spaces) {
    let jump = false
    if (field.contentType == 'Object') jump = true

    let template = `Joi.array().items(${jump ? `\n${spaces}\t` : ''}`

    if (field.contentType == 'String' || field.contentType == 'ObjectId') template += `Joi.string()`
    if (field.contentType == 'Number') template += `Joi.number()`
    if (field.contentType == 'Date') template += `Joi.date()`
    if (field.contentType == 'Object') template += buildObjectStructure(field.structure, `${spaces}\t`)

    template += `${jump ? `\n${spaces.substr(0, spaces.length-1)}` : ''})`
    
    return template
}

function buildObjectStructure(fields, spaces) {
    let template = `Joi.object({\n`

    Object.keys(fields).forEach((key, i) => {
        const field = fields[key]
        template += `${spaces}${key}: `
        
        if (field.type == 'String' || field.type == 'ObjectId') template += `Joi.string()`
        if (field.type == 'Number') template += `Joi.number()`
        if (field.type == 'Date') template += `Joi.date()`
        if (field.type == 'Object') template += buildObjectStructure(field.structure, `${spaces}\t`)
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
    const schema = ${buildObjectStructure(model.fields, '\t\t')}`
    
    template += `\n\n\ttry {
		if (Array.isArray(req.body)) {
			for (let item of req.body) {
				const { error, value } = schema.validate(item)
				if (error) throw { status: 400, message: error.details[0].message, item: value }
			}
		} else {
			const { error, value } = schema.validate(req.body)
			if (error) throw { status: 400, message: error.details[0].message, item: value }
		}

		next()
	} catch (error) {
		res.status(400).send(errorMessages.buildError(error))
	}
}

module.exports = validationSchema`

    return template
}

module.exports = content