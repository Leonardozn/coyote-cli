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

    const qs = [
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
                'hasOne',
                'hasMany'
            ]
        },
        {
            name: 'refModelName',
            type: 'list',
            message: 'Model that will have a reference: ',
            choices: modelList
        },
        {
            name: 'showRefInfo',
            type: 'list',
            message: 'Do you want the reference information to be displayed when listing?',
            choices: [
                'Yes',
                'No'
            ]
        }
    ]

    return inquirer.prompt(qs)
}

function showRefInfoParams(model, reference) {
    const qs = [
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

async function generateReference(data) {
    msn('COYOTE-CLI')

    try {
        const modelName = data.modelName.toLowerCase()
        const referenceName = data.refModelName.toLowerCase()

        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (data.showRefInfo == 'Yes' && !fs.existsSync(controllersDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        
        let settingContent = fs.readFileSync(`${dir}settings.json`)
        let settings = JSON.parse(settingContent)
        
        if (settings.models[referenceName]['foreignKeys']) {
            let exist = false
            settings.models[referenceName].foreignKeys.forEach(fk => {
                if (fk.name == modelName) exist = true
            })

            if (!exist) settings.models[referenceName].foreignKeys.push({ name: modelName, relationType: data.relationType })
        } else {
            settings.models[referenceName]['foreignKeys'] = [{ name: modelName, relationType: data.relationType }]
        }

        fs.writeFileSync(`${modelsDir}/${modelName}.js`, pgApiTemplates.modelTemplate(modelName, settings.models))

        if (data.showRefInfo == 'Yes') {
            data.refInfoParams = await showRefInfoParams(modelName, referenceName)
            
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

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    generateReference(await refParams())
})()