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

function existModelWaring() {
    const qs = [{
        name: 'replace',
        type: 'list',
        message: `${chalk.black.bgYellow('WARNING:')} This model already exists, do you want to replace it?`,
        choices: [
            'Yes',
            'No'
        ]
    }
    ]
    return inquirer.prompt(qs)
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

function addAnyField() {
    const qs = [
        {
            name: 'continue',
            type: 'list',
            message: 'Add any field?',
            choices: [
                'Yes',
                'No'
            ],
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

    let another_attribute = await anotherAttribute()
    subList.push(attribute)

    while(another_attribute.continue == 'Yes') {
        attribute = await schemaAttribute()
        attribute.name = attribute.name.toLowerCase()

        another_attribute = await anotherAttribute()
        subList.push(attribute)
    }

    return subList
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
        } else if (field.type == 'Object') {
    
            field.structure = await addAttribute()
    
        }
    }

    return field
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
        let project = ''
        let res = null

        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        let settingContent = fs.readFileSync(`${dir}settings.json`)
        let settings = JSON.parse(settingContent)

        let createModel = 'Yes'
        if (settings.models[modelName]) {
            createModel = await existModelWaring()
            createModel = createModel.replace
        }

        if (createModel == 'Yes') {
            if (project == 'mongo') {
                apiTemplates = mongoApiTemplates
                res = await addAnyField()

                if (res && res.continue == 'Yes') {
                    field = await addField(project)
                    list.push(field)
                    another_field = await anotherField()
        
                    while (another_field.continue == 'Yes') {
                        field = await addField(project)
                        list.push(field)
                        another_field = await anotherField()
                    }
                }
    
            } else if (project == 'postgres') {
                apiTemplates = pgApiTemplates
                res = await addAnyField()

                if (res && res.continue == 'Yes') {
                    field = await addField(project)
                    list.push(field)
                    another_field = await anotherField()
        
                    while (another_field.continue == 'Yes') {
                        field = await addField(project)
                        list.push(field)
                        another_field = await anotherField()
                    }
                }
    
            }
            
            settings.models[modelName] = {}
            settings.models[modelName]['fields'] = []
            list.forEach(field => settings.models[modelName]['fields'].push({ name: modelName, ...field }))
            
            fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))

            fs.writeFileSync(`${modelsDir}/${modelName}.js`, apiTemplates.modelTemplate(modelName, settings.models))
            if (project == 'postgres') fs.writeFileSync(`${modelsDir}/fields.virtuals.js`, apiTemplates.virtualsTemplate(settings.models))
            fs.writeFileSync(`${controllersDir}/${modelName}.js`, apiTemplates.controllerTemplate(modelName, settings.models))
            fs.writeFileSync(`${routesDir}/${modelName}.js`, apiTemplates.routeTemplate(modelName, settings.models))
            fs.writeFileSync(`${routesDir}/routes.js`, apiTemplates.routesTemplate(settings.models))

            console.log(`Model ${modelName} is created successfully!!`)
        }

    } catch (error) {
        console.error(error)
    }
}

(async () => {
    createModel(await modelParams())
})()