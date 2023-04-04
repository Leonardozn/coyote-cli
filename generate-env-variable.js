#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const inquirer = require('inquirer')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function envVariableParams() {
  const qs = [
    {
        name: 'variableName',
        type: 'input',
        message: 'Variable name: '
    },
    {
        name: 'variableValue',
        type: 'input',
        message: 'Variable value: '
    }
  ]

  return inquirer.prompt(qs)
}

async function createEnviromentVariable(data) {
    msn('COYOTE-CLI')

    try {
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const configDir = `${srcDir}/config`
        const settingsDir = `${process.cwd()}/settings.json`

        if (!fs.existsSync(settingsDir)) throw new Error('This project does not contain the settings file.')
        if (!fs.existsSync(configDir)) throw new Error('This project does not have the correct "coyote-cli" structure.')

        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)
        
        settings.environmentKeyValues.push({
            name: data.variableName,
            value: data.variableValue
        })
        
        fs.writeFileSync(`${dir}/.env`, mongoApiTemplates.envTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${dir}/.env-example`, mongoApiTemplates.envExampleTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${dir}ecosystem.config.js`, mongoApiTemplates.pm2EcosystemTemplate(settings))
        fs.writeFileSync(`${configDir}/app.js`, mongoApiTemplates.configTemplate(settings.environmentKeyValues))

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings, null, 2))

        console.log('Enviroment variable added successfully!!')
    } catch (error) {
        console.error(error)
    }
}

(async () => {
    createEnviromentVariable(await envVariableParams())
})()