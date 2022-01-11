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

async function allInterfaces() {
    msn('COYOTE-CLI')

    try {
        const dir = `${process.cwd()}/`
        const publicDir = `${dir}/public`
        const srcDir = `${dir}/src`
        const assetsDir = `${srcDir}/assets`
        const componentsDir = `${srcDir}/components`
        const routerDir = `${srcDir}/router`
        const storeDir = `${srcDir}/store`
        const viewsDir = `${srcDir}/views`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(publicDir)) all = false
        if (!fs.existsSync(assetsDir)) all = false
        if (!fs.existsSync(routerDir)) all = false
        if (!fs.existsSync(componentsDir)) all = false
        if (!fs.existsSync(storeDir)) all = false
        if (!fs.existsSync(viewsDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "vue-cli" structure.')
        
        if (!fs.existsSync(`${dir}settings.json`)) throw new Error('This project must have a "settings.json" file in root path.')

        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)
        let models = Object.keys(settings.models)
        let errors = ''

        if (models.indexOf('auth') > -1) models.splice(models.indexOf('auth'), 1)
        if (models.indexOf('interfaces') > -1) models.splice(models.indexOf('interfaces'), 1)

        for (let model of models) {
            let count = 0
            if (models[model].foreignKeys) {
                for (let field of models[model].foreignKeys) {
                    if (field.compound) count++
                }
            }

            if (count > 1) {
                errors += `The model "${model}" has more that one compound foreign keys.`
                break
            }
        }

        if (errors.length)  throw new Error(errors)

        for (let model of models) {
            let compound = false
            if (models[model].foreignKeys) {
                for (let field of models[model].foreignKeys) {
                    if (field.compound) {
                        compound = true
                        break
                    }
                }
            }

            if (compound) {

            } else {
                
            }
        }

        console.log('All interfaces are created successfully!!')

    } catch (error) {
        console.log(error)
    }
}

(async () => {
    allInterfaces()
})()