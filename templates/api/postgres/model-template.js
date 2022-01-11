const utils = require('../../../controllers/utils')

function content(model, models) {
    let fields = ''
    let sequalize = false
    let list = models[model].fields
    let references = []
    let usedReferences = []
    let definitions = []

    Object.keys(models).forEach(key => {
        if (models[key].foreignKeys) {
            models[key].foreignKeys.forEach(fk => {
                if (fk.name == model) {
                    let obj = { name: key, relation: fk.relationType, alias: fk.alias }
                    if (Object.keys(fk).indexOf('allowNull') > -1) obj.allowNull = fk.allowNull
                    if (Object.keys(fk).indexOf('validations') > -1) obj.validations = fk.validations

                    references.push(obj)
                }
            })
        }
    })

    list.sort((a, b) => {
        const positionA = a.position || 0
        const positionB = b.position || 0

        if (positionA > positionB) {
            return 1
        } else if (positionA < positionB) {
            return -1
        }
    })
    
    list.forEach((field, i) => {
        definitions = Object.keys(field)
        definitions.splice(definitions.indexOf('name'), 1)
        if (definitions.indexOf('label') > -1) definitions.splice(definitions.indexOf('label'), 1)
        if (definitions.indexOf('coyoteAutoIncrement') > -1) definitions.splice(definitions.indexOf('coyoteAutoIncrement'), 1)
        if (definitions.indexOf('interface') > -1) definitions.splice(definitions.indexOf('interface'), 1)
        if (definitions.indexOf('position') > -1) definitions.splice(definitions.indexOf('position'), 1)
        
        if (i > 0) fields += '\t'
        fields += `${field.name}: { `
        
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

            if (def == 'validations') {
                fields += 'validate: { '

                fields = buildValidations(field, fields)
            }

            if (k < definitions.length - 1) fields += ', '

            if (models[model].isManyToMany) fields += `references: { model: ${field.name.capitalize()}, key: 'id' }`
        })

        if (i < list.length - 1) {
            fields += ' },\n'
        } else {
            fields += ' }'
            if (models[model].persistent) fields += ',\n\tarchived: { type: DataTypes.BOOLEAN, required: true, defaultValue: false }'
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
        let relation = ''
        if (ref.relation == 'One-to-One') relation = 'hasOne'
        if (ref.relation == 'One-to-Many') relation = 'hasMany'

        template += `${model.capitalize()}.${relation}(${ref.name.capitalize()}, { as: '${as}', `
        template += `foreignKey: { name: '${ref.alias}'${Object.keys(ref).indexOf('allowNull') > -1 ? ', alluwNull: ' + ref.allowNull : ''}`

        if (Object.keys(ref).indexOf('validations') > -1) {
            template += ', validate: { '

            template = buildValidations(ref, template)
        }

        template += ' } })\n'

        template += `${ref.name.capitalize()}.belongsTo(${model.capitalize()}, { as: '${as}', `
        template += `foreignKey: { name: '${ref.alias}'${Object.keys(ref).indexOf('allowNull') > -1 ? ', alluwNull: ' + ref.allowNull : ''}`

        if (Object.keys(ref).indexOf('validations') > -1) {
            template += ', validate: { '

            template = buildValidations(ref, template)
        }

        template += ' } })\n'
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

function buildValidations(field, fields) {
    Object.keys(field.validations).forEach((validation, j) => {
        if (field.validations[validation].msg) {
            fields += `${validation}: { msg: '${field.validations[validation].msg}' }`
        } else {
            fields += `${validation}: ${field.validations[validation]}`
        }

        if (j == Object.keys(field.validations).length - 1) {
            fields += ' }'
        } else {
            fields += ', '
        }
    })

    return fields
}

module.exports = content