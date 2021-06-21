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

        // if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        // if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        let settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
        let settings = JSON.parse(settingContent)

        settings.models[schemaName]['activatedSchema'] = true
        let fields = settings.models[schemaName].fields

        for (let i=0; i<fields.length; i++) {
            const label = await setLabel(fields[i].name)
            fields[i]['label'] = label.label
        }

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))
        
        fs.writeFileSync(`${controllersDir}/${schemaName}.js`, pgApiTemplates.controllerTemplate(schemaName, settings.models))
        fs.writeFileSync(`${routesDir}/${schemaName}.js`, pgApiTemplates.routeTemplate(schemaName, settings.models))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    schemaDescription(await getSchema())
})()