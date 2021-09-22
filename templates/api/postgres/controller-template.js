const utils = require('../../../controllers/utils')

function content(model, models) {
    let template = `const ${model.capitalize()} = require('../models/${model}')\n`
    let refShowModel = []
    let modelShowoRef = []
    let usedReferences = []
    let compound = false

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
    
    template += `const utils = require('./utils')
const { Op } = require('sequelize')
const virtuals = require('../models/fields.virtuals')\n`

    if (models[model].encryptFields) {
        template += `\nasync function add(req, res, next) {\n`

        models[model].encryptFields.forEach(field => {
            template += `    if (req.body.${field}) req.body.${field} = await utils.encryptPwd(req.body.${field})\n`
        })

        template += `\n    ${model.capitalize()}.create(req.body)
    .then(${model} => res.status(201).send({ data: ${model} }))
    .catch(err => next(err))
}\n`
    } else {
        template += `\nfunction add(req, res, next) {
    if (req.body.records) {
        ${model.capitalize()}.bulkCreate(req.body.records)
        .then(${model}_list => res.status(201).send({ data: ${model}_list }))
    } else {
        ${model.capitalize()}.create(req.body)
        .then(${model} => res.status(201).send({ data: ${model} }))
        .catch(err => next(err))
    }
}\n`
    }

    template += `\nfunction selectById(req, res, next) {
    ${model.capitalize()}.findByPk(req.params.id)
    .then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model} no found')
        res.status(200).send({ data: ${model} })
    })
    .catch(err => next(err))
}

function list(req, res, next) {
    let query = {
        attributes: virtuals.${model}_fields,\n`

    const refList = refShowModel.concat(modelShowoRef)

    if (refList.length) template += `        include: [\n`

    refList.forEach((ref, i) => {
        template += `            {
                model: ${ref.name ? ref.name.capitalize() : ref},
                attributes: virtuals.${ref.name ? ref.name : ref}_fields,
                as: '${ref.name ? ref.alias : ref.name}Id'
            }`

        if (i < refList.length - 1) template += ','
        
        template += '\n'

        if (i == refList.length - 1) template += `        ]\n`
    })

    template += `    }
    
    if (Object.keys(req.query).length) {
        query['where'] = {}
        const schema = schemaDesc()
        let promises = []
        let andValues = []
        let orValues = []
        
        Object.keys(req.query).forEach(key => {
            let numberOperators = /\\b(gt|gte|lt|lte|eq|ne)\\b/g
            let generalOperators = /\\b(between|notBetween|and|or)\\b/g
            let operators = []
            
            if (numberOperators.test(JSON.stringify(req.query[key]))) {
                operators = JSON.stringify(req.query[key]).match(numberOperators)
                operators.forEach(operator => {
                    if (Array.isArray(req.query[key][operator])) {
                        req.query[key][operator].forEach(value => {
                            query = queryOperator(operator, query, key, value)
                            promises.push(${model.capitalize()}.findAll(query))
                        })
                    } else {
                        query = queryOperator(operator, query, key, req.query[key][operator])
                        promises.push(${model.capitalize()}.findAll(query))
                    }
                })
            } else if (generalOperators.test(JSON.stringify(req.query[key]))) {
                operators = JSON.stringify(req.query[key]).match(generalOperators)
                operators.forEach(operator => {
                    if (operator == 'and') {
                        let exist = false
                        
                        if (!Array.isArray(req.query[key][operator])) {
                            let obj = { [key]: req.query[key][operator] }

                            for (let val of andValues) {
                                if (JSON.stringify(val) == JSON.stringify(obj)) exist = true
                            }

                            if (!exist) andValues.push(obj)
                        }
                    }

                    if (operator == 'or') {
                        let exist = false

                        if (!Array.isArray(req.query[key][operator])) {
                            let obj = { [key]: req.query[key][operator] }

                            for (let val of orValues) {
                                if (JSON.stringify(val) == JSON.stringify(obj)) exist = true
                            }

                            if (!exist) orValues.push(obj)
                        } else {
                            query = queryOperator(operator, query, key, req.query[key][operator])
                            promises.push(${model.capitalize()}.findAll(query))
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

                promises.push(${model.capitalize()}.findAll(query))
            }
        })
        
        if (andValues.length) {
            query = queryOperator('and', query, null, andValues)
            promises.push(${model.capitalize()}.findAll(query))
        }

        if (orValues.length) {
            query = queryOperator('orManyAttr', query, null, orValues)
            promises.push(${model.capitalize()}.findAll(query))
        }
        
        Promise.all(promises)
        .then(response => {
            let ${model}_requisition_list = []
            response.forEach(array => ${model}_requisition_list = ${model}_requisition_list.concat(array))
            res.status(200).send({ schema: schemaDesc(), amount: ${model}_requisition_list.length, data: ${model}_requisition_list })
        })
        .catch(err => next(err))
    } else {
        ${model.capitalize()}.findAll(query)
        .then(${model}_list => res.status(200).send({ schema: schemaDesc(), amount: ${model}_list.length, data: ${model}_list }))
        .catch(err => next(err))
    }
}\n`

    if (models[model].encryptFields) {

        template += `\nasync function update(req, res, next) {\n`

        models[model].encryptFields.forEach(field => {
            template += `    if (req.body.${field}) req.body.${field} = await utils.encryptPwd(req.body.${field})\n`
        })

    } else {
        template += `\nfunction update(req, res, next) {\n`
    }

    for (let obj in models) {
        for (let item of obj.foreignKeys) {
            if (item.compound) compound = true
        }
    }

    if (compound) {
        template += `    let promises = []
    for (let item of req.body.records) {
        promises.push(Detail_requisition.update(item, { where: { id: item.id } }))
    }
    
    Promise.all(promises)
    .then(detail_requisition_list => res.status(200).send({ amount: detail_requisition_list.length, data: detail_requisition_list }))
    .catch(err => next(err))\n`
    } else {
        template += `    const {id, ...body} = req.body
        
    ${model.capitalize()}.update(req.body, {
        where: {
            id: req.body.id
        }
    })
    .then(${model} => res.status(200).send({ data: ${model} }))
    .catch(err => next(err))\n`
    }

`}

function options(req, res, next) {
    res.status(200).send({ data: schemaDesc() })
}
        
function schemaDesc() {
    const schemaDesc = {\n`

        let definitions = []

        models[model].fields.forEach((field, j) => {
            definitions = Object.keys(field)
            template += `\t\t${field.name}: { `

            definitions.forEach((def, k) => {
                if (def == 'name') template += `model: '${field.name}'`
                if (def == 'type') template += `type: '${field.type}'`
                if (def == 'unique') template += `unique: ${field.unique}`
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
                    template += ', '
                } else {
                    if (j < models[model].fields.length - 1) {
                        template += ' },\n'
                    } else {
                        if (models[model].foreignKeys) {
                            template += ' },\n'

                            models[model].foreignKeys.forEach((field, i) => {
                                template += `\t\t${field.alias}: { model: '${field.name}', type: 'foreignKey', relation: '${field.relationType}'`

                                if (field.label) template += `, label: '${field.label}' }`
                                if (field.compound) template += `, compound: ${field.compound} }`
                                    
                                template += ' }'
                
                                if (i == models[model].foreignKeys.length - 1) {
                                    template += '\n'
                                } else {
                                    template += ',\n'
                                }
                            })
                        } else {
                            template += ' }\n'
                        }
                    }
                }
            })
        })

        template += `\t}
    
    return schemaDesc
}

module.exports = {
    add,
    selectById,
    list,
    options,
    update
}`

    return template
}

module.exports = content