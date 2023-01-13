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
        const testsDir = `${dir}/tests`
        
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
        if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir)

        if (settings.databaseType == 'mongodb') {
            if (Object.keys(settings.models).length) {
                let mongoHostExist = false
                let mongoPortExist = false
                let mongoDatabaseExist = false

                settings.environmentKeyValues.forEach(el => {
                    if (el.name == 'MONGO_HOST') mongoHostExist = true
                    if (el.name == 'MONGO_PORT') mongoPortExist = true
                    if (el.name == 'MONGO_DATABASE') mongoDatabaseExist = true
                })

                if (!mongoHostExist) {
                    settings.environmentKeyValues.push({
                        name: 'MONGO_HOST',
                        value: '127.0.0.1'
                    })
                }

                if (!mongoPortExist) {
                    settings.environmentKeyValues.push({
                        name: 'MONGO_PORT',
                        value: '27017'
                    })
                }

                if (!mongoDatabaseExist) {
                    settings.environmentKeyValues.push({
                        name: 'MONGO_DATABASE',
                        value: settings.databaseName
                    })
                }
                
                fs.writeFileSync(`${dir}/.env`, mongoApiTemplates.envTemplate(settings.environmentKeyValues))
                fs.writeFileSync(`${dir}/.env-example`, mongoApiTemplates.envExampleTemplate(settings.environmentKeyValues))
                fs.writeFileSync(`${dir}/app.js`, mongoApiTemplates.appTemplate(settings))
                fs.writeFileSync(`${dir}ecosystem.config.js`, mongoApiTemplates.pm2EcosystemTemplate(settings))
                fs.writeFileSync(`${configDir}/app.js`, mongoApiTemplates.configTemplate(settings.environmentKeyValues))
                fs.writeFileSync(`${controllersDir}/mongo-query.js`, mongoApiTemplates.mongoQueryTemplate())
                fs.writeFileSync(`${helpersDir}/mongodb.js`, mongoApiTemplates.mongoHelperTemplate())
                fs.writeFileSync(`${modulesDir}/mongoConnection.js`, mongoApiTemplates.moduleTemplate())
            }
            
            fs.writeFileSync(`${modelsDir}/${data.modelName}.js`, mongoApiTemplates.modelTemplate(data.modelName, settings.models[data.modelName]))
            fs.writeFileSync(`${middlewaresDir}/${data.modelName}.js`, mongoApiTemplates.middlewareTemplate(settings.models[data.modelName]))

            fs.writeFileSync(`${controllersDir}/${data.modelName}.js`, mongoApiTemplates.controllerTemplate(data.modelName, settings.models[data.modelName]))
            fs.writeFileSync(`${routesDir}/${data.modelName}.js`, mongoApiTemplates.routeTemplate(data.modelName, settings.models))
            fs.writeFileSync(`${routesDir}/routes.js`, mongoApiTemplates.routesTemplate(settings.models))
            fs.writeFileSync(`${testsDir}/${data.modelName}.test.js`, mongoApiTemplates.testTemplate(data.modelName, settings.models, settings.authenticationApp))
            fs.writeFileSync(`${testsDir}/health.test.js`, mongoApiTemplates.healthTestTemplate(settings.authenticationApp))
        }

        console.log('Model created successfully!!')
    } catch (error) {
        console.error(error)
    }
}

(async () => {
    createModel(await modelParams())
})()