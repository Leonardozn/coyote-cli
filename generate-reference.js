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

function refParams() {
    const settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
    const settings = JSON.parse(settingContent)
    const modelList = Object.keys(settings.models)
    let project = ''
    let qs = []

    if (fs.existsSync(`${process.cwd()}/src/modules/mongoConnection.js`)) project = 'mongo'
    if (fs.existsSync(`${process.cwd()}/src/modules/pgConnection.js`)) project = 'postgres'

    if (project == 'postgres') {
        qs = [
            {
                name: 'refModelName',
                type: 'list',
                message: 'Model that will have a reference: ',
                choices: modelList
            },
            {
                name: 'modelName',
                type: 'list',
                message: 'Model to be referenced: ',
                choices: modelList
            },
            {
                name: 'relationType',
                type: 'list',
                message: 'Relation type: ',
                choices: [
                    'One-to-One',
                    'One-to-Many',
                    'Many-to-Many'
                ]
            }
        ]
    } else if (project == 'mongo') {
        qs = [
            {
                name: 'modelName',
                type: 'list',
                message: 'Model that will have a reference: ',
                choices: modelList
            }
        ]
    }

    return inquirer.prompt(qs)
}

function objectIdFields(model) {
    const settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
    const settings = JSON.parse(settingContent)
    const fields = settings.models[model].fields.map(field => {
        if (field.type == 'ObjectId') return field.name
    })

    const qs = [
        {
            name: 'refInfo',
            type: 'list',
            message: '',
            choices: fields
        }
    ]

    return inquirer.prompt(qs)
}

function showRefInfoParams(model, reference) {
    const qs = [
        {
            name: 'showRefInfo',
            type: 'list',
            message: 'Do you want the reference information to be displayed when listing?',
            choices: [
                'Yes',
                'No'
            ]
        },
        {
            name: 'refInfo',
            type: 'list',
            message: '',
            choices: [
                `${reference} show ${model}`,
                `${model} show ${reference}`,
                'Both of them'
            ]
        }
    ]

    return inquirer.prompt(qs)
}

function getAlias(model) {
    const qs = [
        {
            name: 'getAlias',
            type: 'list',
            message: `The field name for this model will be "${model}Id", want to change it?`,
            choices: [
                'Yes',
                'No'
            ]
        }
    ]

    return inquirer.prompt(qs)
}

function setAlias() {
    const qs = [
        {
            name: 'alias',
            type: 'input',
            message: 'Alias name: '
        }
    ]

    return inquirer.prompt(qs)
}

async function generateReference(data) {
    msn('COYOTE-CLI')

    try {
        const modelName = data.modelName.toLowerCase()
        const referenceName = data.refModelName.toLowerCase()

        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        const modulsDir = `${srcDir}/modules`
        const routesDir = `${srcDir}/routes`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (data.showRefInfo == 'Yes' && !fs.existsSync(controllersDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        
        let settingContent = fs.readFileSync(`${dir}settings.json`)
        let settings = JSON.parse(settingContent)

        let project = ''

        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        if (project == 'postgres') {
            if (data.relationType != 'Many-to-Many') {
                if (!settings.models[referenceName].foreignKeys) settings.models[referenceName].foreignKeys = []

                let refAlias = await getAlias(modelName)
                let aliasName = ''
                let exist = false
                let index = null
                
                if (refAlias.getAlias == 'Yes') {
                    refAlias = await setAlias()
                    if (refAlias.alias.split(' ').length > 1) throw new Error('The alias name cannot contain spaces.')
    
                    aliasName = refAlias.alias
                } else {
                    aliasName = `${modelName}Id`
                }
    
                settings.models[referenceName].foreignKeys.forEach((fk, i) => {
                    if (fk.name == modelName && fk.alias == aliasName) {
                        exist = true
                        index = i
                    }
                })
    
                if (exist) {
                    settings.models[referenceName].foreignKeys[index] = { name: modelName, relationType: data.relationType, alias: aliasName }
                } else {
                    settings.models[referenceName].foreignKeys.push({ name: modelName, relationType: data.relationType, alias: aliasName })
                }

                data.refInfoParams = await showRefInfoParams(modelName, referenceName)

                if (data.refInfoParams.showRefInfo == 'Yes') {
                    if (data.refInfoParams.refInfo == 'Both of them') {
                        settings.models[referenceName].foreignKeys.forEach(fk => {
                            if (fk.name == modelName) fk['showModelInfo'] = true
                        })
        
                        if (settings.models[modelName].showRelationInfo) {
                            let exist = false
                            settings.models[modelName].showRelationInfo.forEach(ref => {
                                if (ref == referenceName) exist = true
                            })
                            if (!exist) settings.models[modelName].showRelationInfo.push(referenceName)
                        } else {
                            settings.models[modelName]['showRelationInfo'] = [referenceName]
                        }
        
                        fs.writeFileSync(`${controllersDir}/${referenceName}.js`, pgApiTemplates.controllerTemplate(referenceName, settings.models))
                        fs.writeFileSync(`${controllersDir}/${modelName}.js`, pgApiTemplates.controllerTemplate(modelName, settings.models))
                    } else if (data.refInfoParams.refInfo == `${referenceName} show ${modelName}`) {
                        settings.models[referenceName].foreignKeys.forEach(fk => {
                            if (fk.name == modelName) fk['showModelInfo'] = true
                        })
        
                        fs.writeFileSync(`${controllersDir}/${referenceName}.js`, pgApiTemplates.controllerTemplate(referenceName, settings.models))
                    } else {
                        if (settings.models[modelName].showRelationInfo) {
                            let exist = false
                            settings.models[modelName].showRelationInfo.forEach(ref => {
                                if (ref == referenceName) exist = true
                            })
                            if (!exist) settings.models[modelName].showRelationInfo.push(referenceName)
                        } else {
                            settings.models[modelName]['showRelationInfo'] = [referenceName]
                        }
        
                        fs.writeFileSync(`${controllersDir}/${modelName}.js`, pgApiTemplates.controllerTemplate(modelName, settings.models))
                    }
                }

                fs.writeFileSync(`${modelsDir}/${modelName}.js`, pgApiTemplates.modelTemplate(modelName, settings.models))
            } else {
                const manyToManyName = `${referenceName}_${modelName}`

                settings.models[manyToManyName] = {}
                settings.models[manyToManyName].fields = []

                settings.models[manyToManyName].fields.push({ name: modelName, type: 'INTEGER' })
                settings.models[manyToManyName].fields.push({ name: referenceName, type: 'INTEGER' })

                settings.models[manyToManyName].isManyToMany = true

                settings.models[referenceName].hasMany = { reference: modelName, table: manyToManyName }
                settings.models[modelName].hasMany = { reference: referenceName, table: manyToManyName }
                fs.writeFileSync(`${controllersDir}/${referenceName}.js`, pgApiTemplates.controllerTemplate(referenceName, settings.models))
                fs.writeFileSync(`${controllersDir}/${modelName}.js`, pgApiTemplates.controllerTemplate(modelName, settings.models))

                fs.writeFileSync(`${modelsDir}/${manyToManyName}.js`, pgApiTemplates.modelTemplate(manyToManyName, settings.models))
                fs.writeFileSync(`${modelsDir}/fields.virtuals.js`, pgApiTemplates.virtualsTemplate(settings.models))
                fs.writeFileSync(`${controllersDir}/${manyToManyName}.js`, pgApiTemplates.controllerTemplate(manyToManyName, settings.models))
                fs.writeFileSync(`${routesDir}/${manyToManyName}.js`, pgApiTemplates.routeTemplate(manyToManyName, settings.models))
            }
        } else if (project == 'mongo') {

        }

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings, null, 2))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    generateReference(await refParams())
})()