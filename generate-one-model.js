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

function modelChoice(settings) {
    let models = Object.keys(settings.models)

    models.splice(models.indexOf('auth'), 1)
    models.splice(models.indexOf('user'), 1)
    models.splice(models.indexOf('role'), 1)
    models.splice(models.indexOf('permissions'), 1)

    const qs = [
        {
            name: 'model',
            type: 'list',
            message: 'Select the model: ',
            choices: models
        }
    ]

    return inquirer.prompt(qs)
}

async function allModels() {
    msn('COYOTE-CLI')

    try {
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulsDir = `${srcDir}/modules`
        const settingsDir = `${process.cwd()}/settings.json`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulsDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        if (!fs.existsSync(settingsDir)) throw new Error('This project does not contain the settings file.')

        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)
        let choice = await modelChoice(settings)
        let project = ''
        
        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        if (project == 'mongo') {

        } else {
            fs.writeFileSync(`${modelsDir}/fields.virtuals.js`, pgApiTemplates.virtualsTemplate(settings.models))

            for (let model of Object.keys(settings.models)) {
                if (model == choice.model) {
                    fs.writeFileSync(`${modelsDir}/${model}.js`, pgApiTemplates.modelTemplate(model, settings.models))
                    fs.writeFileSync(`${controllersDir}/${model}.js`, pgApiTemplates.controllerTemplate(model, settings.models))
                    fs.writeFileSync(`${routesDir}/${model}.js`, pgApiTemplates.routeTemplate(model, settings.models))
                    break
                }
            }
            
            fs.writeFileSync(`${routesDir}/routes.js`, pgApiTemplates.routesTemplate(settings.models))

            console.log('Model created successfully!!')
        }

    } catch (error) {
        console.log(error)
    }
}

(async () => {
    allModels()
})()