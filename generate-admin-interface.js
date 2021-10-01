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

function axiosInstall() {
    console.log('Installing axios...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'axios'], { cwd: `${process.cwd()}`, stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`axios installed successfully!!`)
    })
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

async function createAdminInterface() {
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
    let choice = await modelChoice(settings, 'Select a model to show in the front project: ')
    let description
    let count = 0
    
    while (choice.model != 'Exit') {
        description = await modelDesc()
        settings.models[choice.model].interface = { title: description.title, componentName: description.componentName }
        count++
        
        choice = await modelChoice(settings, 'Another model?')
    }

    try {
        if (count > 0) {
            let packageContent = fs.readFileSync(`${dir}package.json`)
            let package = JSON.parse(packageContent)

            if (!package.dependencies.axios) await axiosInstall()
            if (!package.dependencies['vue-jwt-decode']) await jwtDecodeInstall()

            fs.writeFileSync(`${srcDir}/App.vue`, pgApiTemplates.vueAppTemplate(settings.models))
            fs.writeFileSync(`${componentsDir}/DataTable.vue`, pgApiTemplates.dataTableTemplate())
    
            for (let model in settings.models) {
                if (settings.models[model].interface) {
                    fs.writeFileSync(`${viewsDir}/${settings.models[model].interface.componentName}.vue`, pgApiTemplates.modelViewTemplate(model))
                }
            }
    
            fs.writeFileSync(`${routerDir}/index.js`, pgApiTemplates.routerFrontTemplate(settings.models))
            fs.writeFileSync(`${componentsDir}/Home.vue`, pgApiTemplates.homeTemplate())
            fs.writeFileSync(`${viewsDir}/Home.vue`, pgApiTemplates.homeViewTemplate())
            fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))
    
            console.log(`Interface created successfully!!`)
        }

    } catch (error) {
        console.log(error)
    }
}

(() => {
    createAdminInterface()
})()