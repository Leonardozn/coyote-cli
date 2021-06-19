const utils = require('../../../controllers/utils')

function content(model, models) {
    let fields = ''
    let sequalize = false
    const list = models[model].fields
    let references = []

    Object.keys(models).forEach(key => {
        if (models[key].foreignKeys) {
            models[key].foreignKeys.forEach(fk => {
                if (fk.name == model) references.push({ name: key, relation: fk.relationType })
            })
        }
    })

    list.forEach((field, i) => {
        if (i > 0) fields += '\t'
        
        if (field.type == 'BOOLEAN') {
            fields += `${field.name}: {type: DataTypes.${field.type}, defaultValue: ${field.default}},`
        } else if (field.type == 'UUID') {
            if (field.default) {
                sequalize = true
                fields += `${field.name}: {type: DataTypes.${field.type}, defaultValue: Sequelize.${field.default}},`
            } else {
                fields += `${field.name}: {type: DataTypes.${field.type}},`
            }
        } else {
            fields += `${field.name}: {type: DataTypes.${field.type}},`
        }

        if (i < list.length - 1) fields += '\n'
    })

    let template = `const pgConnection = require('../modules/pgConnection')`

    if (sequalize) {
        template += `\nconst { Sequelize, DataTypes } = require('sequelize')`
    } else {
        template += `\nconst { DataTypes } = require('sequelize')`
    }

    references.forEach(ref => {
        template += `\nconst ${ref.name.capitalize()} = require('./${ref.name}')`
    })

    template += `\n\nconst ${model.capitalize()} = pgConnection.define('${model}', {
    ${fields}
})\n\n`

    references.forEach(ref => {
        template += `${model.capitalize()}.${ref.relation}(${ref.name.capitalize()})\n`
        template += `${ref.name.capitalize()}.belongsTo(${model.capitalize()})\n\n`
    })

    template += `module.exports = ${model.capitalize()}`
    
    return template
}

module.exports = content