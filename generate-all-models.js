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
        const configDir = `${srcDir}/config`
        const modelsDir = `${srcDir}/models`
        const middlewaresDir = `${srcDir}/middlewares`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulesDir = `${srcDir}/modules`
        const helpersDir = `${srcDir}/helpers`
        const loaddersDir = `${srcDir}/loadders`
        const settingsDir = `${process.cwd()}/settings.json`
        
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
                    fs.writeFileSync(`${middlewaresDir}/${modelName}.js`, mongoApiTemplates.middlewareTemplate(settings.models[modelName]))

                    fs.writeFileSync(`${controllersDir}/${modelName}.js`, mongoApiTemplates.controllerTemplate(modelName, settings.models[modelName]))
                    fs.writeFileSync(`${routesDir}/${modelName}.js`, mongoApiTemplates.routeTemplate(modelName, settings.models))
                }
            })
            
            fs.writeFileSync(`${routesDir}/routes.js`, mongoApiTemplates.routesTemplate(settings.models))
        } else {
            if (Object.keys(settings.models).length) {
                let pgHostExist = false
                let pgUsernameExist = false
                let pgPasswordExist = false
                let pgDatabaseExist = false

                settings.environmentKeyValues.forEach(el => {
                    if (el.name == 'PG_HOST') pgHostExist = true
                    if (el.name == 'PG_USERNAME') pgUsernameExist = true
                    if (el.name == 'PG_PASSWORD') pgPasswordExist = true
                    if (el.name == 'PG_DATABASE') pgDatabaseExist = true
                })

                if (!pgHostExist) {
                    settings.environmentKeyValues.push({
                        name: 'PG_HOST',
                        value: 'localhost'
                    })
                }

                if (!pgUsernameExist) {
                    settings.environmentKeyValues.push({
                        name: 'PG_USERNAME',
                        value: 'postgres'
                    })
                }

                if (!pgPasswordExist) {
                    settings.environmentKeyValues.push({
                        name: 'PG_PASSWORD',
                        value: 'postgres'
                    })
                }

                if (!pgDatabaseExist) {
                    settings.environmentKeyValues.push({
                        name: 'PG_DATABASE',
                        value: settings.databaseName
                    })
                }
                
                fs.writeFileSync(`${dir}/.env`, pgApiTemplates.envTemplate(settings.environmentKeyValues))
                // fs.writeFileSync(`${dir}/.env-example`, pgApiTemplates.envExampleTemplate(settings.environmentKeyValues))
                // fs.writeFileSync(`${dir}/app.js`, pgApiTemplates.appTemplate(settings))
                fs.writeFileSync(`${configDir}/app.js`, pgApiTemplates.configTemplate(settings.environmentKeyValues))
                // fs.writeFileSync(`${controllersDir}/postgres-query.js`, pgApiTemplates.postgresQueryTemplate())
                // fs.writeFileSync(`${modulesDir}/pgConnection.js`, pgApiTemplates.moduleTemplate())
            }

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