const utils = require('../../../controllers/utils')

function content(model, list) {
    let fields = ''
    let virtuals = ''
    list.forEach((field, i) => {
        let isPassword = false
        if (field.name.indexOf('password') > -1) isPassword = true

        if (i > 0) {
            fields += '\t'
            if (!isPassword) virtuals += '\t\t'
        }
        
        if (field.type == 'Array') {
            if (field.contentType == 'ObjectId') {
                if (field.ref) {
                    fields += `${field.name}: [{Schema.Types.ObjectId, ref: '${field.ref.capitalize()}'}],`
                } else {
                    fields += `${field.name}: [Schema.Types.ObjectId],`
                }
            } else if (field.contentType == 'Object') {
                fields += `${field.name}: [{\n`
                field.structure.forEach((attr, i) => {
                    if (i == field.structure.length - 1) {
                        fields += `        ${attr.name}: ${attr.type}\n`
                        fields += '    }],'
                    } else {
                        fields += `        ${attr.name}: ${attr.type},\n`
                    }
                })
            } else if (field.contentType == 'Boolean') {
                fields += `        ${attr.name}: {type: ${attr.type}, default: ${attr.default}},\n`
            } else {
                fields += `${field.name}: [${field.contentType}],`
            }
        } else if (field.type == 'Object') {
            fields += `${field.name}: {\n`
            field.structure.forEach((attr, i) => {
                if (i == field.structure.length - 1) {
                    fields += `        ${attr.name}: ${attr.type}\n`
                    fields += '    },'
                } else {
                    fields += `        ${attr.name}: ${attr.type},\n`
                }
            })
        } else if (field.type == 'ObjectId') {
            if (field.ref) {
                fields += `${field.name}: {type: Schema.Types.ObjectId, ref: '${field.ref.capitalize()}'},`
            } else {
                fields += `${field.name}: {type: Schema.Types.ObjectId},`
            }
        } else if (field.type == 'Boolean') {
            fields += `${field.name}: {type: ${field.type}, default: ${field.default}},`
        } else {
            fields += `${field.name}: {type: ${field.type}},`
        }

        if (!isPassword) virtuals += `${field.name}: this.${field.name},`

        if (i < list.length - 1) {
            fields += '\n'
            if (!isPassword) virtuals += '\n'
        }
    })

    const template = `const mongoose = require('../modules/mongoConnection')
const Schema = mongoose.Schema
const utils = require('../controllers/utils')

const ${model}Schema = new Schema({
    ${fields}
    created: {type: Date},
    status: {type: Boolean, default: true}
})

${model}Schema.virtual('view').get(function() {
    const ${model} = {
        _id: this._id,
        ${virtuals}
        created: this.created,
        status: this.status
    }
    return ${model}
})

const ${model.capitalize()} = mongoose.model('${model.capitalize()}', ${model}Schema)

module.exports = ${model.capitalize()}
    `
    
    return template
}

module.exports = content