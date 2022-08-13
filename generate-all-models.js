#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const utils = require('./controllers/utils')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
const pgApiTemplates = require('./templates/api/postgres/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

async function allModels() {
    msn('COYOTE-CLI')

    try {
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const modelsDir = `${srcDir}/models`
        const middlewaresDir = `${srcDir}/middlewares`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulsDir = `${srcDir}/modules`
        const settingsDir = `${process.cwd()}/settings.json`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(middlewaresDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulsDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        if (!fs.existsSync(settingsDir)) throw new Error('This project does not contain the settings file.')

        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)
        let project = ''
        
        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        if (project == 'mongo') {
            Object.keys(settings.models).forEach(modelName => {
                if (modelName != 'auth') {
                    fs.writeFileSync(`${modelsDir}/${modelName}.js`, mongoApiTemplates.modelTemplate(modelName, settings.models[modelName]))
                    fs.writeFileSync(`${middlewaresDir}/${modelName}.js`, mongoApiTemplates.middlewareTemplate(settings.models[modelName]))
                    fs.writeFileSync(`${controllersDir}/${modelName}.js`, mongoApiTemplates.controllerTemplate(modelName, settings.models[modelName]))
                    fs.writeFileSync(`${routesDir}/${modelName}.js`, mongoApiTemplates.routeTemplate(modelName, settings.models))
                }
            })
            
            fs.writeFileSync(`${routesDir}/routes.js`, mongoApiTemplates.routesTemplate(settings.models))
            fs.writeFileSync(`${modelsDir}/virtuals.js`, mongoApiTemplates.virtualsTemplate(settings.models))
        } else {
            let errors = ''

            for (let model of Object.keys(settings.models)) {
                let count = 0
                if (settings.models[model].foreignKeys) {
                    for (let field of settings.models[model].foreignKeys) {
                        if (field.compound) count++
                    }
                }

                if (count > 1) {
                    errors += `The model "${model}" has more that one compound foreign keys.`
                    break
                }
            }

            if (errors.length)  throw new Error(errors)

            fs.writeFileSync(`${modelsDir}/fields.virtuals.js`, pgApiTemplates.virtualsTemplate(settings.models))

            Object.keys(settings.models).forEach(model => {
                if (model != 'auth') {
                    fs.writeFileSync(`${modelsDir}/${model}.js`, pgApiTemplates.modelTemplate(model, settings.models))
                    fs.writeFileSync(`${controllersDir}/${model}.js`, pgApiTemplates.controllerTemplate(model, settings.models))
                    fs.writeFileSync(`${routesDir}/${model}.js`, pgApiTemplates.routeTemplate(model, settings.models))
                }
            })
            
            fs.writeFileSync(`${routesDir}/routes.js`, pgApiTemplates.routesTemplate(settings.models))
            fs.writeFileSync(`${controllersDir}/mongo-query.js`, mongoApiTemplates.mongoQueryTemplate())
        }
        
        console.log('All models are created successfully!!')
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    allModels()
})()