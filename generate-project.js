#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
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
            name: 'projectName',
            type: 'input',
            message: 'Project name: '
        }
    ]

    return inquirer.prompt(qs)
}

function npmInstallDependencies(projectName) {
    console.log('Installing dependencies...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'cors', 'dotenv', 'express', 'joi', 'mongoose', 'morgan', 'luxon'], { cwd: `${process.cwd()}/${projectName}`, stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`Dependencies installed successfully.`)
        npmInstallDevDependencies(projectName)
    })
}

function npmInstallDevDependencies(projectName) {
    console.log('Installing dev dependencies...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'jest', 'supertest', '@types/jest', '-D'], { cwd: `${process.cwd()}/${projectName}`, stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`Dev dependencies installed successfully.`)
        console.log(`API ${projectName} is created successfully.`)
    })
}

function createApiProject(rootSettings) {
    if (fs.existsSync(rootSettings.apiRoot)) {
        console.log('ERROR: A project with this name already exists.')
    } else {
        fs.mkdirSync(rootSettings.apiRoot)

        let settings = {
            name: rootSettings.projectName,
            models: {},
            projectType: rootSettings.projectType,
            authenticationApp: false,
            databaseName: rootSettings.projectName,
            databaseType: rootSettings.databaseType,
            environmentKeyValues: [{ name: 'EXPRESS_HOSTNAME', value: '0.0.0.0' }, { name: 'MAIN_PATH', value : '' }]
        }

        try {

            fs.writeFileSync(`${rootSettings.apiRoot}/index.js`, mongoApiTemplates.indexTemplate())
            fs.writeFileSync(`${rootSettings.apiRoot}/.gitignore`, mongoApiTemplates.gitignoreTemplate(false))
            fs.writeFileSync(`${rootSettings.apiRoot}/.env`, mongoApiTemplates.envTemplate(settings.environmentKeyValues))
            fs.writeFileSync(`${rootSettings.apiRoot}/.env-example`, mongoApiTemplates.envExampleTemplate(settings.environmentKeyValues))

            if (!fs.existsSync(rootSettings.apiSrcRoot)) fs.mkdirSync(rootSettings.apiSrcRoot)
            if (!fs.existsSync(rootSettings.apiTestsRoot)) fs.mkdirSync(rootSettings.apiTestsRoot)
            if (!fs.existsSync(rootSettings.configRoot)) fs.mkdirSync(rootSettings.configRoot)
            if (!fs.existsSync(rootSettings.modelsRoot)) fs.mkdirSync(rootSettings.modelsRoot)
            if (!fs.existsSync(rootSettings.controllersRoot)) fs.mkdirSync(rootSettings.controllersRoot)
            if (!fs.existsSync(rootSettings.routesRoot)) fs.mkdirSync(rootSettings.routesRoot)
            if (!fs.existsSync(rootSettings.middlewaresRoot)) fs.mkdirSync(rootSettings.middlewaresRoot)
            if (!fs.existsSync(rootSettings.modulesRoot)) fs.mkdirSync(rootSettings.modulesRoot)
            if (!fs.existsSync(rootSettings.helpersRoot)) fs.mkdirSync(rootSettings.helpersRoot)
            if (!fs.existsSync(rootSettings.loaddersRoot)) fs.mkdirSync(rootSettings.loaddersRoot)

            fs.writeFileSync(`${rootSettings.configRoot}/app.js`, mongoApiTemplates.configTemplate(settings.environmentKeyValues))
            
            fs.writeFileSync(`${rootSettings.loaddersRoot}/prototypes.js`, mongoApiTemplates.prototypeLoadderTemplate())
            fs.writeFileSync(`${rootSettings.loaddersRoot}/enviroment.js`, mongoApiTemplates.envLoadderTemplate())
            fs.writeFileSync(`${rootSettings.loaddersRoot}/index.js`, mongoApiTemplates.indexLoadderTemplate())
            
            fs.writeFileSync(`${rootSettings.apiRoot}/package.json`, mongoApiTemplates.packageTemplate(rootSettings.projectName))
            fs.writeFileSync(`${rootSettings.apiRoot}/app.js`, mongoApiTemplates.appTemplate(settings))
            fs.writeFileSync(`${rootSettings.routesRoot}/health.js`, mongoApiTemplates.healthRouteTemplate())
            fs.writeFileSync(`${rootSettings.routesRoot}/routes.js`, mongoApiTemplates.routesTemplate({}))
            fs.writeFileSync(`${rootSettings.helpersRoot}/errorMessages.js`, mongoApiTemplates.errMsgHelperTemplate())
            fs.writeFileSync(`${rootSettings.controllersRoot}/health.js`, mongoApiTemplates.healtCtrlTemplate())
            fs.writeFileSync(`${rootSettings.apiTestsRoot}/health.test.js`, mongoApiTemplates.healthTestTemplate(settings.authenticationApp))
            
            fs.writeFileSync(`${rootSettings.apiRoot}ecosystem.config.js`, mongoApiTemplates.pm2EcosystemTemplate(settings))
            fs.writeFileSync(`${rootSettings.apiRoot}settings.json`, JSON.stringify(settings, null, 2))

            npmInstallDependencies(rootSettings.projectName)
        } catch (error) {
            console.log(error)
        }
    }
}

function projectSettings(data) {
    msn('COYOTE-CLI')

    const apiRoot = `${process.cwd()}/${data.projectName}/`
    const apiSrcRoot = `${apiRoot}/src`
    const apiTestsRoot = `${apiRoot}/tests`

    const apiRootSettings = {
        databaseType: 'mongodb',
        projectName: data.projectName,
        apiRoot: apiRoot,
        apiSrcRoot: apiSrcRoot,
        apiTestsRoot: apiTestsRoot,
        configRoot: `${apiSrcRoot}/config`,
        modelsRoot: `${apiSrcRoot}/models`,
        controllersRoot: `${apiSrcRoot}/controllers`,
        routesRoot: `${apiSrcRoot}/routes`,
        middlewaresRoot: `${apiSrcRoot}/middlewares`,
        modulesRoot: `${apiSrcRoot}/modules`,
        helpersRoot: `${apiSrcRoot}/helpers`,
        loaddersRoot: `${apiSrcRoot}/loadders`
    }

    createApiProject(apiRootSettings)
}

(async () => {
    projectSettings(await queryParams())
})()