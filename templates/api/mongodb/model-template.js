const utils = require('../../../controllers/utils')

function content(model, models) {
    let fields = ''
    const list = models[model].fields
    
    list.forEach((field, i) => {

        if (i > 0) fields += '\t'
        
        if (field.type == 'Array') {
            if (field.contentType == 'ObjectId') {
                fields += `${field.name}: [{ type: Schema.Types.ObjectId`

                if (field.ref) fields += `, ref: ${field.ref.capitalize()}`
                if (field.defaultValue) fields += `, default: ${field.defaultValue}`

                fields += ' }]'
            } else if (field.contentType == 'Object') {
                fields += `${field.name}: [{\n`

                field.structure.forEach((attr, i) => {
                    fields += `\t\t${attr.name}: { type: ${attr.type} }`

                    if (i < field.structure.length - 1) fields += ','

                    fields += '\n'
                })

                fields += '\t}]'
            } else {
                fields += `${field.name}: [{ type: ${field.contentType}`
                if (field.defaultValue) fields += `, default: ${field.defaultValue}`

                fields += ' }]'
            }
        } else if (field.type == 'Object') {
            fields += `${field.name}: {\n`

            field.structure.forEach((attr, i) => {
                fields += `\t\t${attr.name}: { type: ${attr.type} }`

                if (i < field.structure.length - 1) fields += ','

                fields += '\n'
            })

            fields += '\t}'
        } else if (field.type == 'ObjectId') {
            fields += `${field.name}: { type: Schema.Types.ObjectId`

            if (field.ref) fields += `, ref: ${field.ref.capitalize()}`
            if (field.defaultValue) fields += `, default: ${field.defaultValue}`

            fields += ' }'
        } else {
            fields += `${field.name}: { type: ${field.type}`
            if (field.defaultValue) fields += `, default: ${field.defaultValue}`

            fields += ' }'
        }

        if (i < list.length - 1) fields += ',\n'
    })

    let template = `const mongoose = require('../modules/mongoConnection')
const Schema = mongoose.Schema
const utils = require('../controllers/utils')

const ${model}Schema = new Schema({
    ${fields}
})

${model}Schema.virtual('view').get(function() {
    const ${model} = {
        _id: this._id,\n`

    list.forEach((field, i) => {
        if (field.name.indexOf('password') == -1) template += `\t\t${field.name}: this.${field.name}`
        if (i < list.length) template += `,\n`
    })

    template += `\t}
    
    return ${model}
})

const ${model.capitalize()} = mongoose.model('${model.capitalize()}', ${model}Schema)

module.exports = ${model.capitalize()}`
    
    return template
}

module.exports = content