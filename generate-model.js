#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
const pgApiTemplates = require('./templates/api/postgres/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function modelParams() {
    const qs = [{
        name: 'modelName',
        type: 'input',
        message: 'Model name: '
    }
    ]
    return inquirer.prompt(qs)
}

function schemaFields(db) {
    let types = {}

    if (db == 'mongo') {
        types = {
            name: 'type',
            type: 'list',
            message: 'Select the field type: ',
            choices: [
                'String',
                'Number',
                'Date',
                'Boolean',
                'Array',
                'Object',
                'ObjectId'
            ]
        }
    } else if (db == 'postgres') {
        types = {
            name: 'type',
            type: 'list',
            message: 'Select the field type: ',
            choices: [
                'TEXT',
                'INTEGER',
                'BIGINT',
                'FLOAT',
                'DOUBLE',
                'DATE',
                'DATEONLY',
                'BOOLEAN',
                'UUID'
            ]
        }
    }
    
    const qs = [{
        name: 'name',
        type: 'input',
        message: 'Field name: '
    },
    types
    ]
    return inquirer.prompt(qs)
}

function arrayContentType() {
    const qs = [
        {
            name: 'type',
            type: 'list',
            message: 'Select the array content type: ',
            choices: [
                'String',
                'Number',
                'Date',
                'Boolean',
                'Object',
                'ObjectId'
            ]
        }
    ]

    return inquirer.prompt(qs)
}

function populateField() {
    const qs = [
        {
            name: 'ref',
            type: 'list',
            message: 'Do you want to populate for this field?',
            choices: [
                'Yes',
                'No'
            ],
        }
    ]

    return inquirer.prompt(qs)
}

function populateName() {
    const qs = [
        {
            name: 'name',
            type: 'input',
            message: 'Indicate the model name: '
        }
    ]

    return inquirer.prompt(qs)
}

function anotherField() {
    const qs = [
        {
            name: 'continue',
            type: 'list',
            message: 'Add another field?',
            choices: [
                'Yes',
                'No'
            ],
        }
    ]

    return inquirer.prompt(qs)
}

function schemaAttribute() {
    const qs = [{
        name: 'name',
        type: 'input',
        message: 'Attribute name: '
    },
    {
        name: 'type',
        type: 'list',
        message: 'Select the attribute type: ',
        choices: [
            'String',
            'Number',
            'Date',
            'Boolean'
        ]
    }
    ]
    return inquirer.prompt(qs)
}

function anotherAttribute() {
    const qs = [
        {
            name: 'continue',
            type: 'list',
            message: 'Add another attribute?',
            choices: [
                'Yes',
                'No'
            ],
        }
    ]

    return inquirer.prompt(qs)
}

async function addAttribute () {
    let subList = []
    let attribute = await schemaAttribute()
    attribute.name = attribute.name.toLowerCase()

    if (attribute.type == 'Boolean') attribute.default = await defaultValue()

    let another_attribute = await anotherAttribute()
    subList.push(attribute)

    while(another_attribute.continue == 'Yes') {
        attribute = await schemaAttribute()
        attribute.name = attribute.name.toLowerCase()

        if (attribute.type == 'Boolean') attribute.default = await defaultValue()

        another_attribute = await anotherAttribute()
        subList.push(attribute)
    }

    return subList
}

function setDefault() {
    const qs = [
        {
            name: 'setDefault',
            type: 'list',
            message: 'Do you want to add a default value to it?',
            choices: [
                'Yes',
                'No'
            ],
        }
    ]

    return inquirer.prompt(qs)
}

function defaultValue(type) {
    let defaults = {}

    if (type == 'boolean') {
        defaults = {
            name: 'default',
            type: 'list',
            message: 'Default value:',
            choices: [
                'true',
                'false'
            ],
        }
    } else if (type == 'uuid') {
        defaults = {
            name: 'default',
            type: 'list',
            message: 'Default value:',
            choices: [
                'UUIDV1',
                'UUIDV4'
            ],
        }
    }
    const qs = [defaults]

    return inquirer.prompt(qs)
}

async function addField(db) {
    let field = await schemaFields(db)
    field.name = field.name.toLowerCase()
    
    if (db = 'mongo') {
        if (field.type == 'Array') {
            const contentType = await arrayContentType()
            field.contentType = contentType.type
    
            if (field.contentType == 'Object') {
                field.structure = await addAttribute()
            }
        } else if (field.type == 'Boolean') {
            field.default = await defaultValue('boolean')
        } else if (field.type == 'Object') {
    
            field.structure = await addAttribute()
    
        } else if (field.type == 'ObjectId') {
            const populate = await populateField()
            if (populate.ref == 'Yes') {
                const modelRef = await populateName()
                field.ref = modelRef.name.toLowerCase()
            }
        }
    } else if (db == 'postgres') {
        if (field.type == 'BOOLEAN') {
            field.default = await defaultValue('boolean')
        } else if (field.type == 'UUID') {
            const response = await setDefault()
            if (response.setDefault == 'Yes') field.default = await defaultValue('uuid')
        }
    }

    return field
}

function overwriteRoutes(dir, model) {
    let routesContent = fs.readFileSync(`${dir}/routes.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true

    routesContent.forEach(line => {
        if (line.indexOf(`${model}Router`) > -1) overwrite = false
    })

    if (overwrite) {
        let lines = routesContent.map(item => item)

        routesContent.forEach((line, i) => {
            if (line.indexOf('function getRouter()') > -1) {
                lines.splice(i - 1, 0, `const ${model}Router = require('./${model}')`)
            }
        })

        routesContent = lines.map(item => item)

        routesContent.forEach((line, i) => {
            if (line.indexOf('return router') > -1) {
                lines.splice(i - 1, 0, `    ${model}Router(router)`)
            }
        })

        routesContent = lines.map(item => item)
    }

    let template = ''
    routesContent.forEach(line => template += `${line}\n`)

    return template
}

async function createModel(data) {
    msn('COYOTE-CLI')
    try {
        
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const configDir = `${srcDir}/config`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulsDir = `${srcDir}/modules`
        
        const modelName = data.modelName.toLowerCase()
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(configDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulsDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')

        let apiTemplates = null
        let list = []
        let field = null
        let another_field = null

        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) {
            apiTemplates = mongoApiTemplates

            field = await addField('mongo')
            list.push(field)
            another_field = await anotherField()

            while (another_field.continue == 'Yes') {
                field = await addField('mongo')
                list.push(field)
                another_field = await anotherField()
            }
        } else if (fs.existsSync(`${modulsDir}/pgConnection.js`)) {
            apiTemplates = pgApiTemplates

            field = await addField('postgres')
            list.push(field)
            another_field = await anotherField()

            while (another_field.continue == 'Yes') {
                field = await addField('postgres')
                list.push(field)
                another_field = await anotherField()
            }
        }
        
        fs.writeFileSync(`${modelsDir}/${modelName}.js`, apiTemplates.modelTemplate(modelName, list))
        fs.writeFileSync(`${controllersDir}/${modelName}.js`, apiTemplates.controllerTemplate(modelName))
        fs.writeFileSync(`${routesDir}/${modelName}.js`, apiTemplates.routeTemplate(modelName))
        fs.writeFileSync(`${routesDir}/routes.js`, overwriteRoutes(routesDir, modelName))

        console.log(`Model ${modelName} is created successfully!!`)

    } catch (error) {
        console.error(error)
    }
}

(async () => {
    createModel(await modelParams())
})()