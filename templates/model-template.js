const utils = require('../controllers/utils')

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

        let fieldType = field.type
        if (field.type == 'ObjectId') fieldType = 'Schema.Types.ObjectId'

        fields += `${field.name}: {type: ${fieldType}},`
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