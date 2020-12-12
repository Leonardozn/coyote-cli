#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const templates = require('./templates/templates')

function msn(msn) {
  console.log(chalk.bold.cyan(figlet.textSync(msn, { 
    font:  'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })))
}

function queryParams() {
  const qs = [{
      name: 'projectName',
      type: 'input',
      message: 'Project name: '
    }
  ];
  return inquirer.prompt(qs);
}

function createBaseProject(data) {
  msn('COYOTE-CLI')
  
  const dir = `${process.cwd()}/${data.projectName}/`
  const srcDir = `${dir}/src`
  const configDir = `${srcDir}/config`
  const modelsDir = `${srcDir}/models`
  const controllersDir = `${srcDir}/controllers`
  const routesDir = `${srcDir}/routes`
  const modulsDir = `${srcDir}/modules`

  if (!fs.existsSync(dir)) fs.mkdirSync(dir)

  try {

    fs.writeFileSync(`${dir}/index.js`, templates.indexTemplate())
    fs.writeFileSync(`${dir}/package.json`, templates.packageTemplate(data.projectName))
    fs.writeFileSync(`${dir}/app.js`, templates.appTemplate())
    fs.writeFileSync(`${dir}/.gitignore`, templates.gitignoreTemplate())
    fs.writeFileSync(`${dir}/.env`, templates.envTemplate())

    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir)
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir)
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir)
    if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir)
    if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir)
    if (!fs.existsSync(modulsDir)) fs.mkdirSync(modulsDir)

    fs.writeFileSync(`${configDir}/app.js`, templates.configTemplate())

    fs.writeFileSync(`${controllersDir}/health.js`, templates.healtCtrlTemplate())
    fs.writeFileSync(`${controllersDir}/utils.js`, templates.utilsTemplate())

    fs.writeFileSync(`${routesDir}/health.js`, templates.healthRouteTemplate())
    fs.writeFileSync(`${routesDir}/routes.js`, templates.routesTemplate())
    fs.writeFileSync(`${modulsDir}/mongoConnection.js`, templates.moduleTemplate())

    console.log(`Project ${data.projectName} is created successfully.`)

  } catch (error) {
    console.log(error)
  }
}

(async() => {
    createBaseProject(await queryParams())
})()