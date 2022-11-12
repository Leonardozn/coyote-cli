function content(model) {
    let template = `const Joi = require('joi')
const errorMessages = require('../helpers/errorMessages')

function validationSchema(req, res, next) {
    const schema = Joi.object({\n`

    Object.keys(model.fields).forEach((key, i) => {
        const field = model.fields[key]
        template += `\t\t${key}: `
        
        if (field.type == 'String' || field.type == 'ObjectId') template += `Joi.string()`
        if (field.type == 'Number') template += `Joi.number()`
        if (field.type == 'Date') template += `Joi.date()`
        if (field.unique || field.required) {
            template += `.required()`
        } else {
            if (field.type == 'String' || field.type == 'ObjectId' || field.type == 'Date') template += `.allow(null).allow("")`
            if (field.type == 'Number') template += `.allow(null)`
        }

        if (i < Object.keys(model.fields).length - 1) template += `,\n`
    })

    template += `\n\t})
    
    try {
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