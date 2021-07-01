const utils = require('../../../controllers/utils')

function content(model, models) {
    const list = Object.values(models)
    
    let template = `const ${model.capitalize()} = require('../models/${model}')
const utils = require('./utils')\n\n`

    if (models[model].encryptFields) {
        template += `async function add(req, res, next) {\n`

        models[model].encryptFields.forEach(field => {
            template += `\tif (req.body.${field}) req.body.${field} = await utils.encryptPwd(req.body.${field})\n`
        })

        template += `\tconst ${model} = new ${model.capitalize()}(req.body)

    ${model}.save().then(_${model} => res.status(201).send({ data: _${model}.view }))
    .catch(err => next(err))
}\n`
    } else {
        template += `function add(req, res, next) {
    const ${model} = new ${model.capitalize()}(req.body)
    
    ${model}.save().then(_${model} => res.status(201).send({ data: _${model}.view }))
    .catch(err => next(err))
}\n`
    }

    template += `\nfunction selectById(req, res, next) {
    ${model.capitalize()}.findOne({_id: req.params.id})\n`

    list.forEach(field => {
        if (field.ref) template += `\t.populate({ path: '${field.ref}', select: '-__v' })\n`
    })

    template += `\t.then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model.capitalize()} no found')
        res.status(200).send({ data: ${model}.view })
    })
    .catch(err => next(err))
}

function list(req, res, next) {
    let query = {}
    const schema = schemaDesc()

    if (req.query) {
        Object.keys(req.query).forEach(key => {

            if (Array.isArray(req.query[key])) {
                let list = []

                if (schema[key].type == 'String') {
                    req.query[key].forEach(val => list.push(new RegExp(val, 'i')))
                    query[key] = { $in: list }
                } else if (schema[key].type == 'Object') {
                    let obj = {}
                    keyValues = {}
                    
                    req.query[key].forEach(val => {
                        obj = JSON.parse(val)
                        keyValues = utils.objectKeyValues(key, keyValues, obj, schema)
                    })

                    Object.keys(keyValues).forEach(keyVal => query[\`\${key}.\${keyVal}\`] = { $in: keyValues[keyVal] })
                    console.log(query)
                } else {
                    req.query[key].forEach(val => list.push(val))
                    query[key] = { $in: list }
                }
            } else if (schema[key].type == 'String') {
                query[key] = { $regex: new RegExp(req.query[key], 'i') }
            } else if (schema[key].type == 'Object') {
                let obj = JSON.parse(req.query[key])
                query = utils.buildJsonQuery(key, obj, schema)
            } else {
                query[key] = req.query[key]
            }

        })
    }
    
    ${model.capitalize()}.find(query)\n`

    list.forEach(field => {
        if (field.ref) template += `\t.populate({ path: '${field.ref}', select: '-__v' })\n`
    })

    template += `\t.then(list => {
        let ${model}_list = []
        list.forEach(${model} => ${model}_list.push(${model}.view))

        res.status(200).send({ schema: schemaDesc(), amount: ${model}_list.length, data: ${model}_list })

    })
    .catch(err => next(err))
}\n`

    if (models[model].encryptFields) {
        template += `\nasync function update(req, res, next) {\n`

        models[model].encryptFields.forEach(field => {
            template += `\tif (req.body.${field}) req.body.${field} = await utils.encryptPwd(req.body.${field})\n`
        })
    } else {
        template += `\nfunction update(req, res, next) {\n`
    }

    template += `\t${model.capitalize()}.findOne({_id: req.body._id})
    .then(${model} => {
        if (!${model}) throw new utils.apiError(400, '${model.capitalize()} no found')
        Object.assign(${model}, req.body)
        ${model}.save()
        .then(_${model} => res.status(200).send({ data: _${model}.view }))
        .catch(err => next(err))
    })
    .catch(err => next(err))
}

function options(req, res, next) {
    res.status(200).send({ data: schemaDesc() })
}
        
function schemaDesc() {
    const schemaDesc = {\n`

        let definitions = []

        models[model].fields.forEach((field, i) => {
            definitions = Object.keys(field)
            definitions.splice(definitions.indexOf('name'), 1)
            if (field.contentType) definitions.splice(definitions.indexOf('contentType'), 1)
            if (field.structure) definitions.splice(definitions.indexOf('structure'), 1)

            template += `\t\t${field.name}: { `

            definitions.forEach((def, k) => {
                if (def == 'type') {
                    if (field.type == 'Array') {
                        if (field.contentType == 'Object') {
                            let subDefinitions = []
                            template += `type: '${field.type}', array_content: '${field.contentType}', obj_structure: { `

                            field.structure.forEach((obj, j) => {
                                subDefinitions = Object.keys(obj)
                                subDefinitions.splice(subDefinitions.indexOf('name'), 1)
                                template += `${obj.name}: { `
    
                                subDefinitions.forEach((subDef, k) => {
                                    if (subDef == 'type') template += `type: '${obj.type}'`
                                    if (subDef == 'unique') template += `unique: ${obj.unique}`
                                    if (subDef == 'required') template += `required: ${obj.required}`
                                    if (subDef == 'defaultValue') template += `default: ${obj.defaultValue}`
                                    if (subDef == 'label') template += `label: ${obj.label}`
    
                                    if (k < subDefinitions.length - 1) template += ', '
                                })
    
                                template += ' }'
                                if (j < field.structure.length - 1) template += ', '
                            })

                            template += ' }'
                        } else {
                            template += `type: '${field.type}', array_content: '${field.contentType}'`
                        }
                    } else if (field.type == 'Object') {
                        let subDefinitions = []
                        template += `type: '${field.type}', obj_structure: { `

                        field.structure.forEach((obj, j) => {
                            subDefinitions = Object.keys(obj)
                            subDefinitions.splice(subDefinitions.indexOf('name'), 1)
                            template += `${obj.name}: { `

                            subDefinitions.forEach((subDef, k) => {
                                if (subDef == 'type') template += `type: '${obj.type}'`
                                if (subDef == 'unique') template += `unique: ${obj.unique}`
                                if (subDef == 'required') template += `required: ${obj.required}`
                                if (subDef == 'defaultValue') template += `default: ${obj.defaultValue}`
                                if (subDef == 'label') template += `label: ${obj.label}`

                                if (k < subDefinitions.length - 1) template += ', '
                            })

                            template += ' }'
                            if (j < field.structure.length - 1) template += ', '
                        })

                        template += ' }'
                    } else {
                        template += `type: '${field.type}'`
                    }
                }
                if (def == 'unique') template += `unique: ${field.unique}`
                if (def == 'required') template += `required: ${field.required}`
                if (def == 'defaultValue') template += `default: ${field.defaultValue}`
                if (def == 'label') template += `label: ${field.label}`
    
                if (k < definitions.length - 1) template += ', '
            })

            if (i < models[model].fields.length - 1) {
                template += ' },\n'
            } else {
                template += ' }\n'
            }
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