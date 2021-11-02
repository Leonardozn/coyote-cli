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

function optionType(message) {
    const qs = [
        {
            name: 'type',
            type: 'list',
            message: message,
            choices: [
                'Single option',
                'Group of options',
                'Exit'
            ]
        }
    ];
    return inquirer.prompt(qs);
}

function optionGroupName() {
    const qs = [
        {
            name: 'name',
            type: 'input',
            message: 'Set the name to this option group: '
        }
    ];
    return inquirer.prompt(qs);
}

function modelChoice(settings, message) {
    let models = Object.keys(settings.models)
    models.splice(models.indexOf('user'), 1)
    models.splice(models.indexOf('auth'), 1)
    models.splice(models.indexOf('role'), 1)
    models.splice(models.indexOf('permissions'), 1)
    models.splice(models.indexOf('interfaces'), 1)
    
    models.forEach((model, i) => {
        if (settings.models[model].isManyToMany) models.splice(i, 1)
    })

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
    let option = await optionType('Choose the type of option: ')
    let count = 0
    let choice = null
    let description = null
    if (!settings.models.interfaces) {
        settings.models.interfaces = {
            home: { type: 'single', title: 'Home', path: 'home', componentName: 'Home' }
        }
    }
    
    while (option.type != 'Exit') {
        if (option.type == 'Single option') {
            choice = await modelChoice(settings, 'Select a model to show in the front project: ')
            
            if (choice.model != 'Exit') {
                description = await modelDesc()
                settings.models.interfaces[choice.model] = { type: 'single', title: description.title, path: choice.model, componentName: description.componentName }
                count++
            }
        } else if (option.type == 'Group of options') {
            let optionGroup = await optionGroupName()

            if (optionGroup.name.indexOf('_') > -1) {
                let groupTitle = optionGroup.name.replace('_', ' ')
                settings.models.interfaces[optionGroup.name] = { type: 'group', title: groupTitle.capitalize(), options: [] }
            } else {
                settings.models.interfaces[optionGroup.name] = { type: 'group', title: optionGroup.name.capitalize(), options: [] }
            }

            choice = await modelChoice(settings, 'Select a model to show in the front project: ')
            
            while (choice.model != 'Exit') {
                description = await modelDesc()
                settings.models.interfaces[optionGroup.name].options.push({ title: description.title, path: choice.model, componentName: description.componentName })
                count++

                choice = await modelChoice(settings, 'Another model?')
            }
        }

        option = await optionType('Another option?')
    }


    try {
        if (count > 0) {
            let packageContent = fs.readFileSync(`${dir}package.json`)
            let package = JSON.parse(packageContent)

            if (!package.dependencies.axios) axiosInstall()
            if (!package.dependencies['vue-jwt-decode']) jwtDecodeInstall()

            fs.writeFileSync(`${srcDir}/store/index.js`, pgApiTemplates.vueStoreTemplate(settings.models, false))
            fs.writeFileSync(`${srcDir}/App.vue`, pgApiTemplates.vueAppTemplate(false))
            fs.writeFileSync(`${componentsDir}/DataTable.vue`, pgApiTemplates.vueDataTableTemplate())
    
            for (let model in settings.models.interfaces) {
                if (settings.models.interfaces[model]) {
                    if (settings.models.interfaces[model].type == 'group') {
                        for (let option of settings.models.interfaces[model].options) {
                            fs.writeFileSync(`${viewsDir}/${option.componentName}.vue`, pgApiTemplates.vueModelViewTemplate(option.path))
                        }
                    } else {
                        fs.writeFileSync(`${viewsDir}/${settings.models.interfaces[model].componentName}.vue`, pgApiTemplates.vueModelViewTemplate(model))
                    }
                }
            }
    
            fs.writeFileSync(`${routerDir}/index.js`, pgApiTemplates.vueRouterTemplate(settings.models, false))
            fs.writeFileSync(`${componentsDir}/Home.vue`, pgApiTemplates.homeTemplate())
            fs.writeFileSync(`${viewsDir}/Home.vue`, pgApiTemplates.vueHomeViewTemplate())
            fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings, null, 2))
    
            console.log(`Interface created successfully!!`)
        }

    } catch (error) {
        console.log(error)
    }
}

(() => {
    createAdminInterface()
})()