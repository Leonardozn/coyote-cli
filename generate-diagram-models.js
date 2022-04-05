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

function getFileName() {
    const qs = [
        {
            name: 'fileName',
            type: 'input',
            message: 'set the diagram file name: '
        }
    ]

    return inquirer.prompt(qs)
}

function setLabel(name) {
    if (name.indexOf('-') > -1) name = name.replaceAll('-', ' ')
    if (name.indexOf('_') > -1) name = name.replaceAll('_', ' ')

    return name.capitalize()
}

async function diagramModels() {
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
        let project = ''
        
        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        if (project == 'mongo') {

        } else {
            let res = await getFileName()
            const diagramFileDir = `${process.cwd()}/${res.fileName}.mdj`

            if (!fs.existsSync(diagramFileDir)) throw new Error('This file does not exist, make sure it is in the project path.')

            let diagramContent = fs.readFileSync(diagramFileDir)
            let diagramSettings = JSON.parse(diagramContent.toString())

            let entities = diagramSettings.ownedElements[0].ownedElements

            entities.forEach((entity, i) => {
                if (i > 0) {
                    settings.models[entity.name] = { fields: [] }

                    entity.columns.forEach((column, j) => {
                        if (column.name != 'id') {
                            if (!column.foreignKey) {
                                let model = { name: column.name, type: column.type, label: setLabel(column.name) }

                                if (column.type == 'DATE') {
                                    model.type = 'DATEONLY'
                                    model.validations = { isDate: true }
                                }

                                if (column.type == 'DATETIME') {
                                    model.type = 'DATE'
                                    model.validations = { isDate: true }
                                }

                                if (column.type == 'INTEGER') model.validations = { isInt: true }
                                if (column.type == 'FLOAT') model.validations = { isFloat: true }

                                if (column.unique) model.unique = true
                                if (column.nullable) model.allowNull = false
                                model.position = j
    
                                settings.models[entity.name].fields.push(model)
                            } else {
                                if (!settings.models[entity.name].foreignKeys) settings.models[entity.name].foreignKeys = []
                                let compound = false

                                if (column.name.indexOf('(com)') > -1) {
                                    column.name = column.name.replace('(com)', '')
                                    compound = true
                                }

                                let model_reference = ''
                                for (let item of entities) {
                                    if (item.columns) {
                                        let next = true
                                        for (let col of item.columns) {
                                            if (col._id == column.referenceTo.$ref) {
                                                model_reference = item.name
                                                next = false
                                                break
                                            }
                                            if (!next) break
                                        }
                                    }
                                }

                                let model = { name: model_reference, relationType: 'One-to-One', label: setLabel(column.name.trim()), validations: { isInt: true } }
                                
                                if (compound) {
                                    model.compound = true
                                    model.relationType = 'One-to-Many'
                                }

                                if (column.unique) model.unique = true
                                if (column.nullable) model.allowNull = false

                                const models = Object.keys(settings.models)
                                let exist = false

                                for (let model of models) {
                                    if (settings.models[model].foreignKeys) {
                                        for (let fk of settings.models[model].foreignKeys) {
                                            if (fk.alias == column.name.trim()) {
                                                exist = true
                                                break
                                            }
                                        }
                                    }
                                    if (exist) break
                                }

                                if (exist) {
                                    model.alias = `${column.name.trim()}_${entity.name}`
                                } else {
                                    model.alias = column.name.trim()
                                }

                                model.showModelInfo = true
                                model.position = j

                                settings.models[entity.name].foreignKeys.push(model)
                            }
                        }
                    })
                }
            })

            fs.writeFileSync(settingsDir, JSON.stringify(settings, null, 2))
        }
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    diagramModels()
})()