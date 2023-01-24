#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')

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
        const configDir = `${srcDir}/config`
        const modelsDir = `${srcDir}/models`
        const middlewaresDir = `${srcDir}/middlewares`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulesDir = `${srcDir}/modules`
        const helpersDir = `${srcDir}/helpers`
        const loaddersDir = `${srcDir}/loadders`
        const settingsDir = `${process.cwd()}/settings.json`
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

        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)

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

            Object.keys(settings.models).forEach(modelName => {
                if (modelName != 'auth') {
                    fs.writeFileSync(`${modelsDir}/${modelName}.js`, mongoApiTemplates.modelTemplate(modelName, settings.models[modelName]))
                    fs.writeFileSync(`${middlewaresDir}/${modelName}.js`, mongoApiTemplates.middlewareTemplate(settings.models[modelName], modelName))
                    fs.writeFileSync(`${controllersDir}/${modelName}.js`, mongoApiTemplates.controllerTemplate(modelName, settings.models[modelName]))
                    fs.writeFileSync(`${routesDir}/${modelName}.js`, mongoApiTemplates.routeTemplate(modelName, settings.models))
                    fs.writeFileSync(`${testsDir}/${modelName}.test.js`, mongoApiTemplates.testTemplate(modelName, settings.models, settings.authenticationApp))
                }
            })
            
            fs.writeFileSync(`${routesDir}/routes.js`, mongoApiTemplates.routesTemplate(settings.models))
            fs.writeFileSync(`${testsDir}/health.test.js`, mongoApiTemplates.healthTestTemplate(settings.authenticationApp))
        }

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings, null, 2))
        
        console.log('All models are created successfully!!')
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    allModels()
})()