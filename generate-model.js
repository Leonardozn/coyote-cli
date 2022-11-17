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
    const qs = [
        {
            name: 'modelName',
            type: 'input',
            message: 'Model name: '
        }
    ]

    return inquirer.prompt(qs)
}

async function createModel(data) {
    msn('COYOTE-CLI')

    try {
        
        const settingsDir = `${process.cwd()}/settings.json`
        
        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)

        if (!settings.models[data.modelName]) throw new Error(`${data.modelName} not exist.`)
        
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const configDir = `${srcDir}/config`
        const modelsDir = `${srcDir}/models`
        const middlewaresDir = `${srcDir}/middlewares`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulesDir = `${srcDir}/modules`
        const helpersDir = `${srcDir}/helpers`
        const loaddersDir = `${srcDir}/loadders`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(configDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulesDir)) all = false
        if (!fs.existsSync(loaddersDir)) all = false
        if (!fs.existsSync(helpersDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        if (!fs.existsSync(settingsDir)) throw new Error('This project does not contain the settings file.')

        if (!fs.existsSync(middlewaresDir)) fs.mkdirSync(middlewaresDir)

        if (settings.databaseType == 'mongodb') {
            fs.writeFileSync(`${modelsDir}/${data.modelName}.js`, mongoApiTemplates.modelTemplate(data.modelName, settings.models[data.modelName]))
            fs.writeFileSync(`${middlewaresDir}/${data.modelName}.js`, mongoApiTemplates.middlewareTemplate(settings.models[data.modelName]))

            if (settings.projectType == 'standard') {
                fs.writeFileSync(`${controllersDir}/${data.modelName}.js`, mongoApiTemplates.controllerTemplate(data.modelName, settings.models[data.modelName]))
                fs.writeFileSync(`${routesDir}/${data.modelName}.js`, mongoApiTemplates.routeTemplate(data.modelName, settings.models))
            } else {
                fs.writeFileSync(`${controllersDir}/${data.modelName}.js`, mongoApiTemplates.controllerSocketTemplate(data.modelName, settings.models[data.modelName]))
                fs.writeFileSync(`${routesDir}/${data.modelName}.js`, mongoApiTemplates.routeSocketTemplate(data.modelName, settings.models))
            }
        }

        console.log('Model created successfully!!')
    } catch (error) {
        console.error(error)
    }
}

(async () => {
    createModel(await modelParams())
})()