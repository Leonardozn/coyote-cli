#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const utils = require('./controllers/utils')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function refParams() {
    const qs = [
        {
            name: 'modelName',
            type: 'input',
            message: 'Model that will be a reference: ' 
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
            type: 'input',
            message: 'Model that will have a reference: '
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
                `${model} show ${reference}`,
                `${reference} show ${model}`,
                'Both of them'
            ]
        }
    ]

    return inquirer.prompt(qs)
}

function overwriteModel(dir, model, reference, relation) {
    let modelContent = fs.readFileSync(`${dir}/${model}.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    
    let lines = modelContent.map(item => item)
    let flag = true

    modelContent.forEach((line, i) => {
        if (line.indexOf(`${reference.capitalize()}.belongsTo`) > -1) flag = false
    })

    if (flag) {
        modelContent.forEach((line, i) => {
            if (line.indexOf('pgConnection.define') > -1) {
                lines.splice(i - 1, 0, `const ${reference.capitalize()} = require('./${reference}')`)
            }
        })
    
        modelContent = lines.map(item => item)
    
        modelContent.forEach((line, i) => {
            if (line.indexOf('module.exports') > -1) {
                lines.splice(i - 1, 0, `\n${model.capitalize()}.${relation}(${reference.capitalize()})`)
                lines.splice(i, 0, `${reference.capitalize()}.belongsTo(${model.capitalize()})`)
            }
        })
    
        modelContent = lines.map(item => item)
    }

    let template = ''
    modelContent.forEach((line, i) => {
        if (i == modelContent.length - 1) {
            template += line
        } else {
            template += `${line}\n`
        }
    })

    return template
}

function overwriteController(dir, model, reference) {
    let controllerContent = fs.readFileSync(`${dir}/${model}.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    
    let lines = controllerContent.map(item => item)
    let flag = true

    controllerContent.forEach((line, i) => {
        if (line.indexOf(`const ${reference.capitalize()}`) > -1) flag = false
    })
    
    if (flag) {
        controllerContent.forEach((line, i) => {
            if (line.indexOf(`const ${model.capitalize()}`) > -1) {
                lines.splice(i + 1, 0, `const ${reference.capitalize()} = require('../models/${reference}')`)
            }
        })
    
        controllerContent = lines.map(item => item)
    
        controllerContent.forEach((line, i) => {
            if (line.indexOf('let query = { where: {}, include:') > -1) {
                let start = 0
                let end = 0
                let references = ''

                if (line.indexOf('[') > -1) {
                    for (let j=0; j<line.length; j++) {
                        if (line[j] === '[') start = j + 1
                        if (line[j] === ']') end = j
                    }

                    references = line.slice(start, end)
                    references = references.split(',')
                    references.push(`{ model: ${reference.capitalize()} }`)
                } else {
                    for (let j=0; j<line.length; j++) {
                        if (line[j] == ':') start = j + 1
                        if (line[j] == '}') end = j
                    }

                    references = line.slice(start, end).trim()
                    references = references.split(',')
                    references[0] = `{ model: ${references[0]} }`
                    references.push(`{ model: ${reference.capitalize()} }`)
                }
                
                let str = `        let query = { where: {}, include: [`
                references.forEach((item, index) => {
                    if (index == references.length - 1) {
                        str += `${item}] }`
                    } else {
                        str += `${item}, `
                    }
                })

                lines[i] = str
            } else if (line.indexOf('let query = { where: {} }') > -1) {
                lines.splice(i, 1, `        let query = { where: {}, include: ${reference.capitalize()} }`)
            }
        })
    
        controllerContent = lines.map(item => item)
    
        controllerContent.forEach((line, i) => {
            if (line.indexOf(`${model.capitalize()}.findAll()`) > -1) {

                lines.splice(i, 1, `        ${model.capitalize()}.findAll({ include: ${reference.capitalize()} })`)
            
            } else if (line.indexOf(`${model.capitalize()}.findAll({ include`) > -1) {
                let start = 0
                let end = 0
                let references = ''

                if (line.indexOf('[') > -1) {
                    for (let j=0; j<line.length; j++) {
                        if (line[j] === '[') start = j + 1
                        if (line[j] === ']') end = j
                    }

                    references = line.slice(start, end)
                    references = references.split(',')
                    references.push(`{ model: ${reference.capitalize()} }`)
                } else {
                    for (let j=0; j<line.length; j++) {
                        if (line[j] == ':') start = j + 1
                        if (line[j] == '}') end = j
                    }

                    references = line.slice(start, end).trim()
                    references = references.split(',')
                    references[0] = `{ model: ${references[0]} }`
                    references.push(`{ model: ${reference.capitalize()} }`)
                }
                
                let str = `        ${model.capitalize()}.findAll({ include: [`
                references.forEach((item, index) => {
                    if (index == references.length - 1) {
                        str += `${item}] })`
                    } else {
                        str += `${item}, `
                    }
                })

                lines[i] = str
            }
            
        })
    
        controllerContent = lines.map(item => item)
    }

    let template = ''
    controllerContent.forEach((line, i) => {
        if (i == controllerContent.length - 1) {
            template += line
        } else {
            template += `${line}\n`
        }
    })

    return template
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

        if (data.showRefInfo == 'Yes') {
            data.refInfoParams = await showRefInfoParams(modelName, referenceName)
            
            if (data.refInfoParams.refInfo == 'Both of them') {
                fs.writeFileSync(`${controllersDir}/${modelName}.js`, overwriteController(controllersDir, modelName, referenceName))
                fs.writeFileSync(`${controllersDir}/${referenceName}.js`, overwriteController(controllersDir, referenceName, modelName))
            } else if (data.refInfoParams.refInfo == `${modelName} show ${referenceName}`) {
                fs.writeFileSync(`${controllersDir}/${modelName}.js`, overwriteController(controllersDir, modelName, referenceName))
            } else {
                fs.writeFileSync(`${controllersDir}/${referenceName}.js`, overwriteController(controllersDir, referenceName, modelName))
            }
        }

        fs.writeFileSync(`${modelsDir}/${modelName}.js`, overwriteModel(modelsDir, modelName, referenceName, data.relationType))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    generateReference(await refParams())
})()