const utils = require('../../../controllers/utils')

function content(model, models) {
    let fields = ''
    let sequalize = false
    const list = models[model].fields
    let references = []
    let definitions = []

    Object.keys(models).forEach(key => {
        if (models[key].foreignKeys) {
            models[key].foreignKeys.forEach(fk => {
                if (fk.name == model) references.push({ name: key, relation: fk.relationType })
            })
        }
    })

    list.forEach((field, i) => {
        definitions = Object.keys(field)
        definitions.splice(definitions.indexOf('name'), 1)
        if (definitions.indexOf('label') > -1) definitions.splice(definitions.indexOf('label'), 1)
        
        if (i > 0) fields += '\t'
        fields += `${field.name}: {`
        
        definitions.forEach((def, k) => {
            if (def == 'type') fields += `type: DataTypes.${field.type}`
            if (def == 'unique') fields += `unique: ${field.unique}`
            if (def == 'allowNull') fields += `allowNull: ${field.allowNull}`
            if (def == 'defaultValue') {
                if (field.type == 'UUID') {
                    sequalize = true
                    fields += `defaultValue: Sequelize.${field.defaultValue}`
                } else if (field.type == 'DATE') {
                    fields += `defaultValue: DataTypes.${field.defaultValue}`
                } else {
                    fields += `defaultValue: ${field.defaultValue}`
                }
            }

            if (k < definitions.length - 1) fields += ', '
        })

        if (i < list.length - 1) {
            fields += '},\n'
        } else {
            fields += '}'
        }
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