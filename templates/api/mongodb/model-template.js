const utils = require('../../../controllers/utils')

function buildTab(tab, count) {
    let str = ''
    for (let i=0; i<count; i++) str += tab

    return str
}

function buildFieldsTemplate(fields, model, count) {
    let list = []
    if (model.fields) {
        list = Object.keys(model.fields)
    } else {
        list = Object.keys(model)
    }
    
    list.forEach((field, i) => {
        fields += buildTab('\t', count)
        let modelField = {}
        if (model.fields) {
            modelField = model.fields[field]
        } else {
            modelField = model[field]
        }
        
        if (modelField.type == 'Array') {
            if (modelField.contentType == 'ObjectId') {
                fields += `${field}: [{ type: Schema.Types.ObjectId`

                if (modelField.ref) fields += `, ref: ${modelField.ref}`
                if (modelField.defaultValue) fields += `, default: ${modelField.defaultValue}`

                fields += ' }]'
            } else if (modelField.contentType == 'Object') {
                const structureFields = Object.keys(modelField.structure)
                fields += `${field}: [{\n`

                structureFields.forEach((attr, j) => {
                    fields += `${buildTab('\t', count+1)}${attr}: {`

                    if (modelField.structure[attr].type == 'Object') {
                        fields += `\n`
                        fields = buildFieldsTemplate(fields, modelField.structure[attr].structure, count+2)
                        fields += `\n${buildTab('\t', count+1)}}`
                    } else {
                        fields += ` type: ${modelField.structure[attr].type} }`
                        if (j < structureFields.length - 1) fields += ','
                    }

                    fields += '\n'
                })

                fields += `${buildTab('\t', count)}}]`
            } else {
                fields += `${field}: [{ type: ${modelField.contentType}`
                if (modelField.defaultValue) fields += `, default: ${modelField.defaultValue}`

                fields += ' }]'
            }
        } else if (modelField.type == 'Object') {
            const structureFields = Object.keys(modelField.structure)
            fields += `${field}: {\n`

            structureFields.forEach((attr, i) => {
                fields += `${buildTab('\t', count+1)}${attr}: {`

                if (modelField.structure[attr].type == 'Object') {
                    fields += `\n`
                    fields = buildFieldsTemplate(fields, modelField.structure[attr].structure, count+2)
                    fields += `\n${buildTab('\t', count+1)}}`
                } else {
                    fields += ` type: ${modelField.structure[attr].type} }`
                    if (i < structureFields.length - 1) fields += ','
                }

                fields += '\n'
            })

            fields += `${buildTab('\t', count)}}`
        } else if (modelField.type == 'ObjectId') {
            fields += `${field}: { type: Schema.Types.ObjectId`

            if (modelField.ref) fields += `, ref: ${modelField.ref}`
            if (modelField.defaultValue) fields += `, default: ${modelField.defaultValue}`

            fields += ' }'
        } else {
            fields += `${field}: { type: ${modelField.type}`
            if (modelField.defaultValue) fields += `, default: ${modelField.defaultValue}`

            fields += ' }'
        }

        if (i < list.length - 1) fields += ',\n'
    })

    return fields
}

function content(name, model) {
    let fields = ''
    fields = buildFieldsTemplate(fields, model, 1)

    let template = `const mongoose = require('../modules/mongoConnection')
const Schema = mongoose.Schema
const utils = require('../controllers/utils')

const ${name}Schema = new Schema({
${fields}
})

const ${name.capitalize()} = mongoose.model('${name.capitalize()}', ${name}Schema)

module.exports = ${name.capitalize()}`
    
    return template
}

module.exports = content