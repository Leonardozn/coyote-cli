const utils = require('../../../controllers/utils')

function content(model, list, relation, reference) {
    let fields = ''

    list.forEach((field, i) => {
        if (i > 0) fields += '\t'

        if (field.unique) {
            fields += `${field.name}: {type: DataTypes.${field.type}, unique: ${field.unique}},`
        } else {
            fields += `${field.name}: {type: DataTypes.${field.type}},`
        }

        if (i < list.length - 1) fields += '\n'
    })

    let template = `const pgConnection = require('../modules/pgConnection')
const ${reference.capitalize()} = require('./${reference}')
const { DataTypes } = require('sequelize')

const ${model.capitalize()} = pgConnection.define('${model}', {
    ${fields}
})

${model.capitalize()}.${relation}(${reference.capitalize()})
${reference.capitalize()}.belongsTo(${model.capitalize()})

module.exports = ${model.capitalize()}`
    
    return template
}

module.exports = content