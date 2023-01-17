const utils = require('../../../controllers/utils')

function buildTab(tab, count) {
    let str = ''
    for (let i=0; i<count; i++) str += tab

    return str
}

function buildFieldValidations(fields, modelField) {
    try {
        if (modelField.ref) fields += `, ref: '${modelField.ref.capitalize()}'`
        
        if (modelField.hasOwnProperty('defaultValue')) {
            if ( modelField.type == 'String' || modelField.type == 'ObjectId') {
                fields += `, default: '${modelField.defaultValue}'`
            } else {
                fields += `, default: ${modelField.defaultValue}`
            }
        }

        if (modelField.maxLen) {
            if (modelField.type != 'String' || isNaN(modelField.maxLen)) throw new Error(`'maxLen' attribute must be numeric in a 'String' field`)
            fields += `, maxLen: ${modelField.maxLen}`
        }
        if (modelField.minLen) {
            if (modelField.type != 'String' || isNaN(modelField.minLen)) throw new Error(`'minLen' attribute must be numeric in a 'String' field`)
            fields += `, minLen: ${modelField.minLen}`
        }
    
        if (modelField.required) fields += `, required: true`
        if (modelField.trim) fields += `, trim: true`

        if (modelField.unique && !modelField.required) {
            fields += `, unique: true, required: true`
        } else if (modelField.unique) {
            fields += `, unique: true`
        }

        if (modelField.lowercase) fields += `, lowercase: true`
        if (modelField.uppercase) fields += `, uppercase: true`

        if (modelField.max) {
            if (modelField.type != 'Number' || isNaN(modelField.max)) throw new Error(`'max' attribute must be numeric in a 'Number' field`)
            fields += `, max: ${modelField.max}`
        }

        if (modelField.min) {
            if (modelField.type != 'Number' || isNaN(modelField.min)) throw new Error(`'min' attribute must be numeric in a 'Number' field`)
            fields += `, min: ${modelField.min}`
        }

        if (modelField.hidden) fields += `, select: false`
        
        return fields
    } catch (error) {
        console.log(error)
    }
}

function buildJson(field, fields, modelField, count, inArray) {
    const structureFields = Object.keys(modelField.structure)
    fields += `${field}: ${inArray ? '[' : ''}{\n`

    structureFields.forEach((attr, i) => {
        fields += `${buildTab('\t', count+1)}${attr}: {`

        if (modelField.structure[attr].type == 'Object') {
            fields += `\n`
            fields = buildFieldsTemplate(fields, modelField.structure[attr].structure, count+2)
            fields += `\n${buildTab('\t', count+1)}}`
            if (i < structureFields.length - 1) fields += ','
        } else {
            const type = modelField.structure[attr].type

            fields += ` type: ${type == 'ObjectId' ? 'Schema.Types.' : ''}${type}`

            fields = buildFieldValidations(fields, modelField.structure[attr])

            fields += ' }'
            if (i < structureFields.length - 1) fields += ','
        }

        fields += '\n'
    })

    fields += `${buildTab('\t', count)}}${inArray ? ']' : ''}`

    return fields
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

                if (modelField.ref) fields += `, ref: '${modelField.ref.capitalize()}'`

                fields += ' }]'
            } else if (modelField.contentType == 'Object') {
                fields = buildJson(field, fields, modelField, count, true)
            } else {
                fields += `${field}: [{ type: ${modelField.contentType} }]`
            }
        } else if (modelField.type == 'Object') {
            fields = buildJson(field, fields, modelField, count, false)
        } else if (modelField.type == 'ObjectId') {
            fields += `${field}: { type: Schema.Types.ObjectId`

            fields = buildFieldValidations(fields, modelField)

            fields += ' }'
        } else {
            fields += `${field}: { type: ${modelField.type}`
            
            fields = buildFieldValidations(fields, modelField)

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
${model.auth ? "const encryptHelper = require('../helpers/encrypt')\n" : ''}
const ${name}Schema = new Schema({
${fields}
})
${model.auth ? `
userSchema.pre('save', async function(next) {
\tconst user = this

\tif (!user.isModified('password')) return next()

\ttry {
\t\tuser.password = await encryptHelper.encryptPwd(user.password)
\t\tnext()
\t} catch (error) {
\t\tconsole.log(error)
\t\tthrow { status: 500, message: 'Failed to encode password' }
\t}
})

userSchema.methods.toJSON = function() {
\tlet user = this.toObject()
\tdelete user.password
\treturn user
}\n` : ''}
const ${name.capitalize()} = mongoose.model('${name.capitalize()}', ${name}Schema)

module.exports = ${name.capitalize()}`
    
    return template
}

module.exports = content