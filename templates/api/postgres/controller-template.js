const utils = require('../../../controllers/utils')

function content(model, models) {
    let template = `const ${model.capitalize()} = require('../models/${model}')\n`
    let refShowModel = []
    let modelShowoRef = []
    let usedReferences = []
    let oneToMany = false
    let compound = false
    let compoundField = ''
    let autoIncrementField = ''

    if (models[model].foreignKeys) {
        models[model].foreignKeys.forEach(fk => {
            if (fk.showModelInfo) refShowModel.push(fk)
        })
    }

    if (models[model].showRelationInfo) {
        models[model].showRelationInfo.forEach(ref => modelShowoRef.push(ref))
    }

    refShowModel.forEach(ref => {
        if (usedReferences.indexOf(ref.name) == -1) {
            usedReferences.push(ref.name)
            template += `const ${ref.name.capitalize()} = require('../models/${ref.name}')\n`
        }
    })

    modelShowoRef.forEach(ref => {
        if (usedReferences.indexOf(ref) == -1) {
            usedReferences.push(ref)
            template += `const ${ref.capitalize()} = require('../models/${ref}')\n`
        }
    })

    if (models[model].isManyToMany) {
        template += `const ${models[model].fields[0].name.capitalize()} = require('../models/${models[model].fields[0].name}')\n`
        template += `const ${models[model].fields[1].name.capitalize()} = require('../models/${models[model].fields[1].name}')\n`
    }

    for (let field of models[model].fields) {
        if (field.coyoteAutoIncrement) autoIncrementField = field.name
    }
    
    template += `const utils = require('./utils')
const { Op } = require('sequelize')
const virtuals = require('../models/fields.virtuals')

async function add(req, res, next) {
    if (req.body.records) {\n`

    if (autoIncrementField) {
        template += `\t\tlet initCount = await ${model.capitalize()}.findAll({ limit: 1, order: [['${autoIncrementField}', 'DESC']] })
        if (initCount.length) {
            initCount = initCount[0].${autoIncrementField}
        } else {
            initCount = 0
        }

        for (let record of req.body.records) {
            initCount++
            record.${autoIncrementField} = initCount
        }\n\n`
    }
        
    if (models[model].encryptFields) {
        template += `\t\tfor (let item of req.body.records) {\n`
        models[model].encryptFields.forEach(field => {
            template += `\t\t\tif (item.${field}) item.${field} = await utils.encryptPwd(item.${field})\n`
        })
        
        template += `\t\t}\n\n`
    }


    template += `\t\t${model.capitalize()}.bulkCreate(req.body.records)
        .then(${model}_list => res.status(201).send({ data: ${model}_list }))
        .catch(err => next(err))
    } else {\n`

    if (autoIncrementField) {
        template += `\t\tlet initCount = await ${model.capitalize()}.findAll({ limit: 1, order: [['${autoIncrementField}', 'DESC']] })
        if (initCount.length) {
            initCount = initCount[0].${autoIncrementField}
        } else {
            initCount = 0
        }

        for (let record of req.body.records) {
            initCount++
            record.${autoIncrementField} = initCount
        }\n\n`
    }

    if (models[model].encryptFields) {
        models[model].encryptFields.forEach((field, i) => {
            template += `\t\tif (req.body.${field}) req.body.${field} = await utils.encryptPwd(req.body.${field})\n`
            if (i == models[model].encryptFields.length - 1) template += '\n'
        })
    }
        
    template += `\t\t${model.capitalize()}.create(req.body)
        .then(${model} => res.status(201).send({ data: ${model} }))
        .catch(err => next(err))
    }
}\n`

    if (!models[model].isManyToMany) {
        template += `\nfunction selectById(req, res, next) {
    ${model.capitalize()}.findByPk(req.params.id)
    .then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model} no found')
        res.status(200).send({ data: ${model} })
    })
    .catch(err => next(err))
}\n`
    }    

    template += `\nfunction list(req, res, next) {
    let query = {
        attributes: virtuals.${model}_fields,\n`

    let refList = []

    refList = refShowModel.concat(modelShowoRef)
    
    if (refList.length) template += `        include: [\n`

    refList.forEach((ref, i) => {
        let as = utils.aliasName(ref.alias)

        template += `            {
                model: ${ref.name ? ref.name.capitalize() : ref},
                attributes: virtuals.${ref.name ? ref.name : ref}_fields,
                as: '${as}'
            }`

        if (i < refList.length - 1) template += ','
        
        template += '\n'

        if (i == refList.length - 1) template += `        ]\n`
    })

    template += `    }
    
    if (Object.keys(req.query).length) {
        query['where'] = {}
        const schema = schemaDesc()
        let orValues = []
        let orderValues = []
        
        Object.keys(req.query).forEach(key => {
            let numberOperators = /\\b(gt|gte|lt|lte|eq|ne)\\b/g
            let generalOperators = /\\b(between|notBetween|or)\\b/g
            let orderGroupOperators = /\\b(order)\\b/g
            let operators = []
            
            if (numberOperators.test(JSON.stringify(req.query[key]))) {
                operators = JSON.stringify(req.query[key]).match(numberOperators)
                operators.forEach(operator => {
                    if (!Array.isArray(req.query[key][operator])) {
                        query = queryOperator(operator, query, key, req.query[key][operator])
                    }
                })
            } else if (generalOperators.test(JSON.stringify(req.query[key]))) {
                operators = JSON.stringify(req.query[key]).match(generalOperators)
                operators.forEach(operator => {
                    if (operator == 'or') {
                        if (!Array.isArray(req.query[key][operator])) {
                            let obj = { [key]: req.query[key][operator] }
                            orValues.push(obj)
                        } else {
                            query = queryOperator(operator, query, key, req.query[key][operator])
                        }
                    } else if (operator == 'between' || operator == 'notBetween') {
                        let good = true

                        if (Array.isArray(req.query[key][operator]) && req.query[key][operator].length == 2) {
                            if (!isNaN(req.query[key][operator][0])) {
                                req.query[key][operator].forEach(val => {
                                    if (isNaN(val)) good = false
                                })
                            } else if (Date.parse(new Date(req.query[key][operator][0]))) {
                                req.query[key][operator].forEach(val => {
                                    if (isNaN(Date.parse(new Date(val)))) good = false
                                })
                            }
                            
                            if (good) query = queryOperator(operator, query, key, req.query[key][operator])
                        }
                    }
                })
            } else if (orderGroupOperators.test(JSON.stringify(req.query[key]))) {
                operators = JSON.stringify(req.query[key]).match(orderGroupOperators)
                operators.forEach(operator => {
                    if (operator == 'order') {
                        if (!Array.isArray(req.query[key][operator])) {
                            let orderAttr = [key, req.query[key][operator].toUpperCase()]
                            orderValues.push(orderAttr)
                        }
                    }
                })
            } else {
                if (Array.isArray(req.query[key])) {
                    let like = schema[key].type == 'TEXT' ? true : false
                    let items = []
    
                    req.query[key].forEach(val => {
                        if (like) {
                            items.push(\`%\${val}%\`)
                        } else {
                            items.push(val)
                        }
                    })
                    
                    if (like) {
                        query['where'][key] = { [Op.iLike]: { [Op.any]: items } }
                    } else {
                        query['where'][key] = { [Op.in]: items }
                    }
                } else if (schema[key].type == 'TEXT') {
                    query['where'][key] = { [Op.iLike]: \`%\${req.query[key]}%\` }
                } else {
                    query['where'][key] = req.query[key]
                }
            }
        })

        if (orValues.length) query = queryOperator('orManyAttr', query, null, orValues)
        if (orderValues.length) query['order'] = orderValues
    }

    ${model.capitalize()}.findAll(query)
    .then(${model}_list => res.status(200).send({ schema: schemaDesc(), amount: ${model}_list.length, data: ${model}_list }))
    .catch(err => next(err))
}\n`
    
    if (models[model].foreignKeys) {
        for (let item of models[model].foreignKeys) {
            if (item.relation == 'One-to-Many' && !item.compound) {
                oneToMany = true
                break
            }
            
            if (item.compound) {
                compound = true
                compoundField = item.alias
                break
            }
        }
    }

    template += `\n${models[model].encryptFields || compound ? 'async ' : ''}function update(req, res, next) {\n`

    if (oneToMany) {

        template += `\tlet promises = []
    let schema = schemaDesc()
    let attributes = [...virtuals.${model}_fields]

    for (let attr in req.body.records[0]) {
        if (attributes.indexOf(attr) == -1) attributes.push(attr)
    }

    let query = { attributes: attributes, where: {} }

    for (let row of req.body.records) {
        for (let field in schema) {
            if (!schema[field].relation || (schema[field].relation && schema[field].relation == 'One-to-One')) {
                query.where[field] = row[field]
            }
        }
    }
    
    const inDatabase = await ${model.capitalize()}.findAll(query)
    
    for (let item of req.body.records) {
        let exist = false
        let row = {}
        delete item.id
        
        for (let obj of inDatabase) {
            row = { ...obj.dataValues }
            delete row.id
            
            if (JSON.stringify(item) == JSON.stringify(row)) exist = true
        }

        if (!exist) {
            promises.push(${model.capitalize()}.create(item))
        } else {
            promises.unshift(${model.capitalize()}.update(item, query))
        }
    }

    for (let item of inDatabase) {
        let exist = false
        let row = { ...item.dataValues }
        delete row.id

        
        for (let obj of req.body.records) {
            delete obj.id
            
            if (JSON.stringify(obj) == JSON.stringify(row)) exist = true
        }

        if (!exist) {
            promises.push(${model.capitalize()}.destroy({ where: { id: item.id } }))
        }
    }
    
    Promise.all(promises)
    .then(response => {
        let ${model}_list = []
        response.forEach(array => ${model}_list = ${model}_list.concat(array))
        res.status(200).send({ amount: ${model}_list.length, data: ${model}_list })
    })
    .catch(err => next(err))\n`

    } else if (compound) {

        template += `\tlet promises = []
    const inDatabase = await ${model.capitalize()}.findAll({ where: { ${compoundField}: req.body.id } })

    for (let item of req.body.records) {
        if (item.id) {
            promises.unshift(${model.capitalize()}.update(item, { where: { id: item.id } }))
        } else {
            promises.push(${model.capitalize()}.create(item))
        }
    }

    for (let item of inDatabase) {
        let exist = false

        for (let obj of req.body.records) {
            if (item.id == obj.id) exist = true
        }
        
        if (!exist) {
            promises.push(${model.capitalize()}.destroy({ where: { id: item.id } }))
        }
    }
    
    Promise.all(promises)
    .then(response => {
        let ${model}_list = []
        response.forEach(array => ${model}_list = ${model}_list.concat(array))
        res.status(200).send({ amount: ${model}_list.length, data: ${model}_list })
    })
    .catch(err => next(err))\n`

    } else if (models[model].isManyToMany) {

        template += `\tlet promises = []
    let attributes = '${model}'.split('_')
    let query = { attributes: attributes, where: {} }

    if (req.body.records) {
        let values = []
    
        for (let attr of attributes) {
            values = []
            for (let row of req.body.records) {
                values.push({ [attr]: row[attr] })
            }
        }

        query.where = { [Op.or]: values }
        
        const inDatabase = await ${model.capitalize()}.findAll(query)
        
        for (let item of req.body.records) {
            let exist = false
            
            for (let obj of inDatabase) {
                let row = {}
                for (let attr in item) row[attr] = obj.dataValues[attr]

                if (JSON.stringify(item) == JSON.stringify(row)) exist = true
            }
    
            if (!exist) {
                promises.push(${model.capitalize()}.create(item))
            }
        }
    
        for (let item of inDatabase) {
            let exist = false
            
            for (let obj of req.body.records) {
                let row = {}
                for (let attr in obj) row[attr] = item.dataValues[attr]

                if (JSON.stringify(row) == JSON.stringify(obj)) exist = true
            }
            
            if (!exist) {
                for (let attr in item) query.where[attr] = item[attr]
                promises.push(${model.capitalize()}.destroy(query))
            }
        }
    } else {
        query.where = { [req.body.model]: req.body.id }

        const inDatabase = await ${model.capitalize()}.findAll(query)

        for (let item of inDatabase) {
            promises.push(${model.capitalize()}.destroy(query))
        }
    }

    Promise.all(promises)
    .then(response => {
        let ${model}_list = []
        response.forEach(array => ${model}_list = ${model}_list.concat(array))
        res.status(200).send({ amount: ${model}_list.length, data: ${model}_list })
    })
    .catch(err => next(err))\n`

    } else {
        template += `\tif(req.body.records) {\n`
        
        if (models[model].encryptFields) {
            template += `\t\tfor (let item of req.body.records) {\n`

            models[model].encryptFields.forEach(field => {
                template += `\t\t\tif (item.${field}) item.${field} = await utils.encryptPwd(item.${field})\n`
            })
            
            template += `\t\t}\n\n`
        }

        template += `\t\tlet promises = []

        for (let record of req.body.records) {
            const {id, ...body} = record
            promises.push(${model.capitalize()}.update(body, { where: { id: id } }))
        }

        Promise.all(promises)
        .then(response => {
            let ${model}_list = []
            response.forEach(array => ${model}_list = ${model}_list.concat(array))
            res.status(200).send({ amount: ${model}_list.length, data: ${model}_list })
        })
        .catch(err => next(err))
    } else {\n`

        if (models[model].encryptFields) {
            models[model].encryptFields.forEach(field => {
                template += `\t\tif (req.body.${field}) req.body.${field} = await utils.encryptPwd(req.body.${field})\n\n`
            })
        }

        template += `\t\tconst {id, ...body} = req.body

        ${model.capitalize()}.update(body, { where: { id: id } })
        .then(${model} => res.status(200).send({ data: ${model} }))
        .catch(err => next(err))
    }\n`
    }

    template += `}

function remove(req, res, next) {
    let query = { where: {} }

    if (req.body.records) {
        if (req.body.foreignKey) {
            query.where[req.body.foreignKey] = req.body.records
        } else {
            query.where.id = req.body.records
        }
    } else {
        if (req.body.foreignKey) {
            query.where[req.body.foreignKey] = req.body.id
        } else {
            query.where.id = req.body.id
        }
    }\n\n`

    if (models[model].persistent) {
        template += `\t${model.capitalize()}.update({ archived: true }, query)\n`
    } else {
        template += `\t${model.capitalize()}.destroy(query)\n`
    }
    
    template += `\t.then(${model} => res.status(200).send({ data: ${model} }))
    .catch(err => next(err))
}

function options(req, res, next) {
    res.status(200).send({ data: schemaDesc() })
}
        
function schemaDesc() {
    const schemaDesc = {\n`

        let definitions = []

        models[model].fields.forEach((field, j) => {
            definitions = Object.keys(field)
            if (definitions.indexOf('validations') > -1) definitions.splice(definitions.indexOf('validations'), 1)
            if (definitions.indexOf('interface') > -1) definitions.splice(definitions.indexOf('interface'), 1)
            
            template += `\t\t${field.name}: { `

            definitions.forEach((def, k) => {
                // if (def == 'name') template += `name: '${field.name}'`
                if (def == 'type') {
                    if (models[model].isManyToMany) {
                        template += `type: 'foreignKey'`
                    } else {
                        template += `type: '${field.type}'`
                    }
                }
                if (def == 'unique') template += `unique: ${field.unique}`
                if (def == 'coyoteAutoIncrement') template += `coyoteAutoIncrement: ${field.coyoteAutoIncrement}`
                if (def == 'allowNull') template += `required: ${!field.allowNull}`
                if (def == 'defaultValue') {
                    if (field.type == 'UUID' || field.type == 'TEXT' || field.type == 'DATE') {
                        template += `defaultValue: '${field.defaultValue}'`
                    } else {
                        template += `defaultValue: ${field.defaultValue}`
                    }
                }
                if (def == 'label') template += `label: '${field.label}'`
    
                if (k < definitions.length - 1) {
                    if (def != 'name') template += ', '
                } else {
                    if (models[model].isManyToMany) {
                        template += `, relation:' Many-to-Many', alias: '${utils.aliasName(models[model].fields[j].name)}'`
                    }

                    if (models[model].encryptFields && models[model].encryptFields.indexOf(field.name) > -1) {
                        template += ', hidden: true'
                    }
                }
            })

            if (j < models[model].fields.length - 1) {
                template += ' },\n'
            } else {
                if (models[model].foreignKeys) {
                    template += ' },\n'

                    models[model].foreignKeys.forEach((field, i) => {
                        let as = utils.aliasName(field.alias)

                        template += `\t\t${field.alias}: { model: '${field.name}', type: 'foreignKey', relation: '${field.relationType}', alias: '${as}'`

                        if (field.label) template += `, label: '${field.label}'`
                        if (field.compound) template += `, compound: ${field.compound}`
                            
                        template += ' }'
        
                        if (i == models[model].foreignKeys.length - 1) {
                            if (models[model].persistent) {
                                template += `,\n\t\tarchved: { type: 'BOOLEAN', label: 'Estado', required: true }\n`
                            } else {
                                template += '\n'
                            }
                        } else {
                            template += ',\n'
                        }
                    })
                } else {
                    if (models[model].hasMany) {
                        let ref = models[model].hasMany.reference
                        let table = models[model].hasMany.table

                        template += ` },\n\t\t${ref}: { model: '${ref}', label: '${ref.capitalize()}',  type: 'foreignKey', relation: 'Many-to-Many', table: '${table}' }`
                        if (models[model].persistent) template += `,\n\t\tarchved: { type: 'BOOLEAN', label: 'Estado', required: true }`

                        template += '\n'
                    } else {
                        template += ' }'
                        if (models[model].persistent) template += `,\n\t\tarchved: { type: 'BOOLEAN', label: 'Estado', required: true }`

                        template += '\n'
                    }
                }
            }
        })

        template += `\t}
    
    return schemaDesc
}

function queryOperator(operator, query, key, value) {
    if (operator == 'gt') query['where'][key] = { [Op.gt]: parseFloat(value) }
    if (operator == 'gte') query['where'][key] = { [Op.gte]: parseFloat(value) }
    if (operator == 'lt') query['where'][key] = { [Op.lt]: parseFloat(value) }
    if (operator == 'lte') query['where'][key] = { [Op.lte]: parseFloat(value) }
    if (operator == 'eq') query['where'][key] = { [Op.eq]: parseFloat(value) }
    if (operator == 'ne') query['where'][key] = { [Op.ne]: parseFloat(value) }

    if (operator == 'between') query['where'][key] = { [Op.between]: value }
    if (operator == 'notBetween') query['where'][key] = { [Op.notBetween]: value }
    if (operator == 'or') query['where'][key] = { [Op.or]: value }
    if (operator == 'orManyAttr') query['where'] = { [Op.or]: value }

    return query
}

module.exports = {
    add,\n`
    
    if (!models[model].isManyToMany) template += '\tselectById,\n'
    
    template += `\tlist,
    options,
    update,
    remove
}`

    return template
}

module.exports = content