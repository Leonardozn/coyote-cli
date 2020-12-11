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

function modelParams() {
    const qs = [{
        name: 'modelName',
        type: 'input',
        message: 'Model name: '
      }
    ]
    return inquirer.prompt(qs);
}

function schemaFields() {
  const qs = [{
      name: 'name',
      type: 'input',
      message: 'Field name: '
    },
    {
      name: 'type',
      type: 'list',
      message: 'Select the field type: ',
      choices: [
        'String',
        'Number',
        'Date',
        'Boolean',
        'ObjectId'
      ],
    },
    {
      name: 'continue',
      type: 'list',
      message: 'Add another field?',
      choices: [
        'Yes',
        'No'
      ],
    }
  ]
  return inquirer.prompt(qs);
}

function overwriteRoutes(dir, model) {
  let routesContent = fs.readFileSync(`${dir}/routes.js`, {encoding:'utf8', flag:'r'}).split('\n')
  let overwrite = true
  routesContent.forEach(line => {
    if (line.indexOf(`${model}Router`) > -1) overwrite = false
  })

  if (overwrite) {
    let lines = routesContent.map(item => item)
  
    routesContent.forEach((line, i) => {
      if (line.indexOf('function getRouter()') > -1) {
        lines.splice(i-1, 0, `const ${model}Router = require('./${model}')`)
      }
    })

    routesContent = lines.map(item => item)

    routesContent.forEach((line, i) => {
      if (line.indexOf('return router') > -1) {
        lines.splice(i-1, 0, `    ${model}Router(router)`)
      }
    })
    
    routesContent = lines.map(item => item)
  }

  let template = ''
  routesContent.forEach(line => template += `${line}\n`)

  return template 
}

async function createModel(data) {
    msn('COYOTE-CLI')
    try {

      const dir = `${process.cwd()}/`
      const srcDir = `${dir}/src`
      const configDir = `${srcDir}/config`
      const modelsDir = `${srcDir}/models`
      const controllersDir = `${srcDir}/controllers`
      const routesDir = `${srcDir}/routes`
      const modulsDir = `${srcDir}/moduls`

      const modelName = data.modelName.toLowerCase()
      let all = true

      if (!fs.existsSync(srcDir)) all = false
      if (!fs.existsSync(configDir)) all = false
      if (!fs.existsSync(modelsDir)) all = false
      if (!fs.existsSync(controllersDir)) all = false
      if (!fs.existsSync(routesDir)) all = false
      if (!fs.existsSync(modulsDir)) all = false

      if (all === false) throw new Error('This project does not have the correct structure.')

      let list = []
      let fields = await schemaFields()
      list.push(fields)
      
      while(fields.continue == 'Yes') {
        fields = await schemaFields()
        list.push(fields)
      }

      fs.writeFileSync(`${modelsDir}/${modelName}.js`, templates.modelTemplate(modelName, list))
      fs.writeFileSync(`${controllersDir}/${modelName}.js`, templates.controllerTemplate(modelName))
      fs.writeFileSync(`${routesDir}/${modelName}.js`, templates.routeTemplate(modelName))
      fs.writeFileSync(`${routesDir}/routes.js`, overwriteRoutes(routesDir, modelName))

      console.log(`Model ${modelName} is created successfully.`)
      
    } catch (error) {
      console.error(error)
    }
}

(async() => {
    createModel(await modelParams())
})()