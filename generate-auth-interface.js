#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const { spawn } = require('child_process')
const pgApiTemplates = require('./templates/api/postgres/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function modelChoice(settings, message) {
    let models = Object.keys(settings.models)
    models.push('Exit')

    const qs = [
        {
            name: 'model',
            type: 'list',
            message: message,
            choices: models
        }
    ];
    return inquirer.prompt(qs);
}

function modelDesc() {
    const qs = [
        {
            name: 'title',
            type: 'input',
            message: 'Indicate the title that will be displayed in the menu for this model: '
        }, 
        {
            name: 'componentName',
            type: 'input',
            message: 'Enter the name for the component of this model: '
        }
    ];
    return inquirer.prompt(qs);
}

function jwtDecodeInstall() {
    console.log('Installing vue-jwt-decode...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'vue-jwt-decode'], { cwd: `${process.cwd()}`, stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`vue-jwt-decode installed successfully!!`)
    })
}

async function createAuthInterface() {
    msn('COYOTE-CLI')
    
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

    let settingContent = fs.readFileSync(`${dir}settings.json`)
    let settings = JSON.parse(settingContent)

    for (let model in settings.models) {
        if (model == 'user') settings.models[model].interface = { title: "User", componentName: "User" }
        if (model == 'permissions') settings.models[model].interface = { title: "Permissions", componentName: "Permissions" }
    }

    try {
        let packageContent = fs.readFileSync(`${dir}package.json`)
        let package = JSON.parse(packageContent)

        if (!package.dependencies['vue-jwt-decode']) jwtDecodeInstall()

        fs.writeFileSync(`${srcDir}/store/index.js`, pgApiTemplates.vueStoreTemplate(settings.models, true))
        fs.writeFileSync(`${srcDir}/App.vue`, pgApiTemplates.vueAppTemplate(settings.models, true))
        fs.writeFileSync(`${componentsDir}/Login.vue`, pgApiTemplates.vueLoginTemplate())
        fs.writeFileSync(`${viewsDir}/Login.vue`, pgApiTemplates.vueLoginViewTemplate())

        for (let model in settings.models) {
            if (model == 'user' || model == 'permissions') {
                fs.writeFileSync(`${viewsDir}/${settings.models[model].interface.componentName}.vue`, pgApiTemplates.vueModelViewTemplate(model))
            }
        }

        fs.writeFileSync(`${routerDir}/index.js`, pgApiTemplates.vueRouterTemplate(settings.models, true))
        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))

        console.log(`Auth interface created successfully!!`)
    } catch (error) {
        console.log(error)
    }
}

(() => {
    createAuthInterface()
})()