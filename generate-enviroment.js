#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

async function createEnviroment(data) {
    msn('COYOTE-CLI')

    try {
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const configDir = `${srcDir}/config`
        const settingsDir = `${process.cwd()}/settings.json`

        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)

        if (!fs.existsSync(settingsDir)) throw new Error('This project does not contain the settings file.')
        
        fs.writeFileSync(`${dir}/.env`, mongoApiTemplates.envTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${dir}/.env-example`, mongoApiTemplates.envExampleTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${dir}ecosystem.config.js`, mongoApiTemplates.pm2EcosystemTemplate(settings))
        fs.writeFileSync(`${configDir}/app.js`, mongoApiTemplates.configTemplate(settings.environmentKeyValues))

        console.log('Enviroments generated successfully!!')
    } catch (error) {
        console.error(error)
    }
}

(async () => {
    createEnviroment()
})()