const utils = require('../../../controllers/utils')

function content(model, list) {
    let fields = ''
    let sequalize = false

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

    template += `\n\nconst ${model.capitalize()} = pgConnection.define('${model}', {
    ${fields}
})

module.exports = ${model.capitalize()}
    `
    
    return template
}

module.exports = content