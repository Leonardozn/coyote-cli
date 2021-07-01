#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
const pgApiTemplates = require('./templates/api/postgres/templates')
const { spawn } = require('child_process')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function queryParams() {
    const qs = [
        {
            name: 'databaseType',
            type: 'list',
            message: 'Select the database type: ',
            choices: [
                'mongodb',
                'postgres'
            ]
        },
        {
            name: 'projectName',
            type: 'input',
            message: 'Project name: '
        }
    ];
    return inquirer.prompt(qs);
}

async function npmInstall(projectName) {
    console.log('Creating API project...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install'], { cwd: `${process.cwd()}/${projectName}`, stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`API ${projectName} is created successfully.`)
    })
}

function createApiProject(rootSettings) {
    if (fs.existsSync(rootSettings.apiRoot)) {
        console.log('ERROR: A project with this name already exists.')
    } else {
        fs.mkdirSync(rootSettings.apiRoot)
        let apiTemplates = null
        let connectionFileName

        let settings = { models: {}, authenticationApp: false }
        
        if (rootSettings.databaseType == 'mongodb') {

            apiTemplates = mongoApiTemplates
            connectionFileName = 'mongoConnection'
            settings.enviromentKeyValues = [
                {name: 'MONGO_HOST', value: 'localhost'},
                {name: 'MONGO_PORT', value: '27017'},
                {name: 'MONGO_DATABASE', value: 'my_database'}
            ]

        } else if (rootSettings.databaseType == 'postgres') {

            apiTemplates = pgApiTemplates
            connectionFileName = 'pgConnection'
            settings.enviromentKeyValues = [
                {name: 'PG_HOST', value: 'localhost'},
                {name: 'PG_USERNAME', value: 'postgres'},
                {name: 'PG_PASSWORD', value: 'postgres'},
                {name: 'PG_DATABASE', value: 'my_database'}
            ]

        }

        try {

            fs.writeFileSync(`${rootSettings.apiRoot}/index.js`, apiTemplates.indexTemplate())
            fs.writeFileSync(`${rootSettings.apiRoot}/package.json`, apiTemplates.packageTemplate(rootSettings.projectName))
            fs.writeFileSync(`${rootSettings.apiRoot}/app.js`, apiTemplates.appTemplate(settings))
            fs.writeFileSync(`${rootSettings.apiRoot}/.gitignore`, apiTemplates.gitignoreTemplate(false))
            fs.writeFileSync(`${rootSettings.apiRoot}/.env`, apiTemplates.envTemplate(settings.enviromentKeyValues))

            if (!fs.existsSync(rootSettings.apiSrcRoot)) fs.mkdirSync(rootSettings.apiSrcRoot)
            if (!fs.existsSync(rootSettings.configRoot)) fs.mkdirSync(rootSettings.configRoot)
            if (!fs.existsSync(rootSettings.modelsRoot)) fs.mkdirSync(rootSettings.modelsRoot)
            if (!fs.existsSync(rootSettings.controllersRoot)) fs.mkdirSync(rootSettings.controllersRoot)
            if (!fs.existsSync(rootSettings.routesRoot)) fs.mkdirSync(rootSettings.routesRoot)
            if (!fs.existsSync(rootSettings.modulesRoot)) fs.mkdirSync(rootSettings.modulesRoot)

            fs.writeFileSync(`${rootSettings.configRoot}/app.js`, apiTemplates.configTemplate(settings.enviromentKeyValues))

            fs.writeFileSync(`${rootSettings.controllersRoot}/health.js`, apiTemplates.healtCtrlTemplate())
            fs.writeFileSync(`${rootSettings.controllersRoot}/utils.js`, apiTemplates.utilsTemplate(false))

            fs.writeFileSync(`${rootSettings.routesRoot}/health.js`, apiTemplates.healthRouteTemplate())
            fs.writeFileSync(`${rootSettings.routesRoot}/routes.js`, apiTemplates.routesTemplate({}))
            fs.writeFileSync(`${rootSettings.modulesRoot}/${connectionFileName}.js`, apiTemplates.moduleTemplate())

            fs.writeFileSync(`${rootSettings.apiRoot}settings.json`, JSON.stringify(settings))

            npmInstall(rootSettings.projectName)

        } catch (error) {
            console.log(error)
        }
    }
}

function projectSettings(data) {
    msn('COYOTE-CLI')

    const apiRoot = `${process.cwd()}/${data.projectName}/`
    const apiSrcRoot = `${apiRoot}/src`

    const apiRootSettings = {
        databaseType: data.databaseType,
        projectName: data.projectName,
        apiRoot: apiRoot,
        apiSrcRoot: apiSrcRoot,
        configRoot: `${apiSrcRoot}/config`,
        modelsRoot: `${apiSrcRoot}/models`,
        controllersRoot: `${apiSrcRoot}/controllers`,
        routesRoot: `${apiSrcRoot}/routes`,
        modulesRoot: `${apiSrcRoot}/modules`
    }

    createApiProject(apiRootSettings)
}

(async () => {
    projectSettings(await queryParams())
})()