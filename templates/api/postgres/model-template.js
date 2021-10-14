const utils = require('../../../controllers/utils')

function content(model, models) {
    let fields = ''
    let sequalize = false
    const list = models[model].fields
    let references = []
    let usedReferences = []
    let definitions = []

    Object.keys(models).forEach(key => {
        if (models[key].foreignKeys) {
            models[key].foreignKeys.forEach(fk => {
                if (fk.name == model) references.push({ name: key, relation: fk.relationType, alias: fk.alias })
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
                } else if (field.type == 'DATE' || field.type == 'DATEONLY') {
                    fields += `defaultValue: DataTypes.${field.defaultValue}`
                } else {
                    fields += `defaultValue: ${field.defaultValue}`
                }
            }

            if (k < definitions.length - 1 || k == 0) fields += ', '

            if (models[model].isManyToMany) fields += `references: { model: ${field.name.capitalize()}, key: 'id' }`
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

    if (models[model].isManyToMany) {
        list.forEach(field => template += `\nconst ${field.name.capitalize()} = require('./${field.name}')`)
    }

    references.forEach(ref => {
        if (usedReferences.indexOf(ref.name) == -1) {
            usedReferences.push(ref.name)
            template += `\nconst ${ref.name.capitalize()} = require('./${ref.name}')`
        }
    })

    template += `\n\nconst ${model.capitalize()} = pgConnection.define('${model}', {
    ${fields}
})\n\n`

    references.forEach(ref => {
        let as = utils.aliasName(ref.alias)

        if (ref.relation == 'One-to-One') {
            template += `${model.capitalize()}.hasOne(${ref.name.capitalize()}, { as: '${as}', foreignKey: '${ref.alias}' })\n`
            template += `\n${ref.name.capitalize()}.belongsTo(${model.capitalize()}, { as: '${as}', foreignKey: '${ref.alias}' })\n`
        } else if (ref.relation == 'One-to-Many') {
            template += `${model.capitalize()}.hasMany(${ref.name.capitalize()}, { as: '${as}', foreignKey: '${ref.alias}' })\n`
            template += `\n${ref.name.capitalize()}.belongsTo(${model.capitalize()}, { as: '${as}', foreignKey: '${ref.alias}' })\n`
        }
    })

    if (models[model].isManyToMany) {
        let refOne = models[model].fields[0].name
        let refTwo = models[model].fields[1].name

        template += `\n${refOne.capitalize()}.belongsToMany(${refTwo.capitalize()}, { through: ${model.capitalize()}, foreignKey: '${refOne}', as: '${refOne}Id' })\n`
        template += `${refTwo.capitalize()}.belongsToMany(${refOne.capitalize()}, { through: ${model.capitalize()}, foreignKey: '${refTwo}', as: '${refTwo}Id' })\n`
    }

    template += `\nmodule.exports = ${model.capitalize()}`
    
    return template
}

module.exports = content