#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const utils = require('./controllers/utils')
const pgApiTemplates = require('./templates/api/postgres/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function getSchema() {
    const settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
    const settings = JSON.parse(settingContent)
    const modelList = Object.keys(settings.models)

    const qs = [
        {
            name: 'schemaName',
            type: 'list',
            message: 'Select schema: ',
            choices: modelList
        }
    ]

    return inquirer.prompt(qs)
}

function setLabel(field) {
    const qs = [
        {
            name: 'label',
            type: 'input',
            message: `Set the label to "${field}" field: `
        }
    ]

    return inquirer.prompt(qs)
}

function defaultBoolean(field) {
    const qs = [
        {
            name: 'boolean',
            type: 'list',
            message: `Set default value to "${field}" field: `,
            choices: ['true', 'false']
        }
    ]

    return inquirer.prompt(qs)
}

function defaultText(field) {
    const qs = [
        {
            name: 'text',
            type: 'input',
            message: `Set default text to "${field}" field: `
        }
    ]

    return inquirer.prompt(qs)
}

function defaultNumber(field) {
    const qs = [
        {
            name: 'number',
            type: 'input',
            message: `Set default number or amount to "${field}" field: `
        }
    ]

    return inquirer.prompt(qs)
}

function defaultUuid(field) {
    const qs = [
        {
            name: 'uuid',
            type: 'list',
            message: `Set default UUID to "${field}" field: `,
            choices: ['UUIDV1', 'UUIDV4']
        }
    ]

    return inquirer.prompt(qs)
}

async function customDefinition(model, field, definition, settings) {
    if (definition != 'Previous menu') {
        let value

        if (definition == 'label') {

            value = await setLabel(field)
            settings.models[model].fields.forEach((obj, i) => {
                if (obj.name == field) settings.models[model].fields[i][definition] = value.label
            })

        } else if (definition == 'unique') {

            value = await defaultBoolean(field)
            settings.models[model].fields.forEach((obj, i) => {
                if (obj.name == field) settings.models[model].fields[i][definition] = (value.boolean == 'true')
            })

        } else if (definition == 'allowNull') {

            value = await defaultBoolean(field)
            settings.models[model].fields.forEach((obj, i) => {
                if (obj.name == field) settings.models[model].fields[i][definition] = (value.boolean == 'true')
            })

        } else if (definition == 'defaultValue') {
            let obj = {}

            for (let i=0; i<settings.models[model].fields.length; i++) {
                obj = settings.models[model].fields[i]

                if (obj.name == field) {
                    if (obj.type.toLowerCase() == 'boolean') {

                        value = await defaultBoolean(field)
                        settings.models[model].fields[i][definition] = (value.boolean == 'true')

                    } else if (obj.type == 'TEXT' || obj.type == 'String') {

                        value = await defaultText(field)
                        settings.models[model].fields[i][definition] = value.text

                    } else if (obj.type == 'INTEGER' || obj.type == 'BIGINT') {

                        value = await defaultNumber(field)
                        settings.models[model].fields[i][definition] = parseInt(value.number)

                    } else if (obj.type == 'DOUBLE' || obj.type == 'FLOAT') {

                        value = await defaultNumber(field)
                        settings.models[model].fields[i][definition] = parseFloat(value.number)

                    } else if (obj.type == 'DATE') {

                        settings.models[model].fields[i][definition] = 'NOW'

                    } else if (obj.type == 'UUID') {

                        value = await defaultUuid(field)
                        settings.models[model].fields[i][definition] = value.uuid

                    }
                }
            }
        }
    }

    return settings
}

function selectField(fields) {
    let list = fields.map(field => field.name)
    list.push('Exit')

    const qs = [
        {
            name: 'field',
            type: 'list',
            message: `Select a field: `,
            choices: list
        }
    ]

    return inquirer.prompt(qs)
}

function selectDefinition(definitions) {
    const qs = [
        {
            name: 'definition',
            type: 'list',
            message: `Select a field: `,
            choices: definitions
        }
    ]

    return inquirer.prompt(qs)
}

async function schemaDescription(data) {
    msn('COYOTE-CLI')

    try {
        const schemaName = data.schemaName.toLowerCase()

        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulsDir = `${srcDir}/modules`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulsDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        if (!fs.existsSync(`${modelsDir}/${schemaName}.js`)) throw new Error('The schema you indicated does not exist.')

        let settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
        let settings = JSON.parse(settingContent)
        let project = ''
        let definitions = []

        const fields = settings.models[schemaName].fields
        
        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        if (project == 'mongo') {

        } else {
            definitions = ['label', 'unique', 'allowNull', 'defaultValue', 'Previous menu']
        }

        let fieldSelected = await selectField(fields)
        
        if (fieldSelected.field != 'Exit') {
            let selectedDefinition = await selectDefinition(definitions)
            settings = await customDefinition(schemaName, fieldSelected.field, selectedDefinition.definition, settings)
        }

        while (fieldSelected.field != 'Exit') {
            fieldSelected = await selectField(fields)
            
            if (fieldSelected.field != 'Exit') {
                let selectedDefinition = await selectDefinition(definitions)
                settings = await customDefinition(schemaName, fieldSelected.field, selectedDefinition.definition, settings)
            }
        }

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))
        
        fs.writeFileSync(`${modelsDir}/${schemaName}.js`, pgApiTemplates.modelTemplate(schemaName, settings.models))
        fs.writeFileSync(`${controllersDir}/${schemaName}.js`, pgApiTemplates.controllerTemplate(schemaName, settings.models))
        fs.writeFileSync(`${routesDir}/${schemaName}.js`, pgApiTemplates.routeTemplate(schemaName, settings.models))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    schemaDescription(await getSchema())
})()