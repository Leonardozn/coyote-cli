#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const fs = require('fs')
const apiTemplates = require('./templates/api/templates')
const cryptoRandomString = require('crypto-random-string')
const { spawn } = require('child_process')

function overwriteRoutes(dir, model) {
    let routesContent = fs.readFileSync(`${dir}/routes.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true

    routesContent.forEach(line => {
        if (line.indexOf(`${model}Router`) > -1) overwrite = false
    })

    if (overwrite) {
        let lines = routesContent.map(item => item)

        routesContent.forEach((line, i) => {
            if (line.indexOf('function getRouter()') > -1) {
                lines.splice(i - 1, 0, `const ${model}Router = require('./${model}')`)
            }
        })

        routesContent = lines.map(item => item)

        routesContent.forEach((line, i) => {
            if (line.indexOf('return router') > -1) {
                lines.splice(i - 1, 0, `    ${model}Router(router)`)
            }
        })

        routesContent = lines.map(item => item)
    }

    let template = ''
    routesContent.forEach(line => template += `${line}\n`)

    return template
}

function overwriteEnv(dir) {
    let envContent = fs.readFileSync(dir, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true

    envContent.forEach(line => {
        if (line.indexOf('ACCESS_TOKEN_SECRET') > -1 || line.indexOf('REFRESH_TOKEN_SECRET') > -1) overwrite = false 
    })

    if (overwrite) {
        envContent.push(`ACCESS_TOKEN_SECRET=${cryptoRandomString({length: 22, type: 'alphanumeric'})}`)
        envContent.push(`REFRESH_TOKEN_SECRET=${cryptoRandomString({length: 22, type: 'alphanumeric'})}`)
    }
    
    let template = ''
    envContent.forEach((line, i) => {
        if (i == envContent.length - 1) {
            template += line
        } else {
            template += `${line}\n`
        }
    })

    return template
}

function overwriteConfig(dir) {
    let configContent = fs.readFileSync(`${dir}/app.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true

    configContent.forEach(line => {
        if (line.indexOf('ACCESS_TOKEN_SECRET') > -1 || line.indexOf('REFRESH_TOKEN_SECRET') > -1) overwrite = false 
    })

    if (overwrite) {
        let lines = configContent.map(item => item)

        configContent.forEach((line, i) => {
            if (line.indexOf('module.exports') > -1) {
                lines.splice(i - 1, 0, `const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET`)
                lines.splice(i, 0, `const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET`)
            }
        })

        configContent = lines.map(item => item)

        configContent.forEach((line, i) => {
            if (line.indexOf('}') > -1) {
                configContent[i-1] = lines[i-1] += ','
                lines.splice(i, 0, `    ACCESS_TOKEN_SECRET,`)
                lines.splice(i + 1, 0, `    REFRESH_TOKEN_SECRET`)
            }
        })

        configContent = lines.map(item => item)
    }

    let template = ''
    configContent.forEach((line, i) => {
        if (i == configContent.length - 1) {
            template += line
        } else {
            template += `${line}\n`
        }
    })

    return template
}

async function bcryptInstall(projectName) {
    console.log('Installing bcrypt...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'bcrypt'], { cwd: `${process.cwd()}/${projectName}`, stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`Package installed successfully!!`)
    })
}

function overwriteUtils(dir) {
    let utilsContent = fs.readFileSync(`${dir}/utils.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true

    utilsContent.forEach(line => {
        if (line.indexOf(`const bcrypt = require('bcrypt')`) > -1) overwrite = false 
    })

    if (overwrite) {
        let lines = utilsContent.map(item => item)

        utilsContent.forEach((line, i) => {
            if (line.indexOf('function closeConnection(req, res, next) {') > -1) {
                lines.splice(i - 1, 0, `const bcrypt = require('bcrypt')`)
            }
        })

        utilsContent = lines.map(item => item)

        utilsContent.forEach((line, i) => {
            if (line.indexOf('module.exports = {') > -1) {
                lines.splice(i, 0, `function encryptPwd(password) {`)
                lines.splice(i + 1, 0, `    return new Promise((resolve, reject) => {`)
                lines.splice(i + 2, 0, `        bcrypt.hash(password, 10, (err, hash) => {`)
                lines.splice(i + 3, 0, `            if (err) return reject({status: 500, message: err.message})`)
                lines.splice(i + 4, 0, `            return resolve(hash)`)
                lines.splice(i + 5, 0, `        })`)
                lines.splice(i + 6, 0, `    })`)
                lines.splice(i + 7, 0, `}\n`)
                
                lines.splice(i + 8, 0, `function verifyPwd(password, hash) {`)
                lines.splice(i + 9, 0, `    return new Promise((resolve, reject) => {`)
                lines.splice(i + 10, 0, `        bcrypt.compare(password, hash, (err, result) => {`)
                lines.splice(i + 11, 0, `            if (err) return reject({status: 500, message: err.message})`)
                lines.splice(i + 12, 0, `            return resolve(result)`)
                lines.splice(i + 13, 0, `        })`)
                lines.splice(i + 14, 0, `    })`)
                lines.splice(i + 15, 0, `}\n`)
            }
        })

        utilsContent = lines.map(item => item)

        for (let i=utilsContent.length-1; i>0; i--) {
            if (utilsContent[i].indexOf('}') > -1) {
                utilsContent[i-1] = lines[i-1] += ','
                lines.splice(i, 0, `    encryptPwd,`)
                lines.splice(i + 1, 0, `    verifyPwd`)
                break
            }
        }

        utilsContent = lines.map(item => item)
    }
    
    let template = ''
    utilsContent.forEach((line, i) => {
        if (i == utilsContent.length - 1) {
            template += line
        } else {
            template += `${line}\n`
        }
    })

    return template
}

try {
    console.log(chalk.bold.cyan(figlet.textSync('COYOTE-CLI', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))

    const models = [
        {
            name: 'role',
            fields: [
                {name: 'name', type: 'String'},
                {name: 'permissions', type: 'Array', contentType: 'String'}
            ],
            auth: false
        },
        {
            name: 'user',
            fields: [
                {name: 'username', type: 'String'},
                {name: 'email', type: 'String'},
                {name: 'password', type: 'String'},
                {name: 'role', type: 'ObjectId', ref: 'role'}
            ],
            auth: true
        }
    ]
    
    const dir = `${process.cwd()}/`
    const srcDir = `${dir}/src`
    const configDir = `${srcDir}/config`
    const modelsDir = `${srcDir}/models`
    const controllersDir = `${srcDir}/controllers`
    const middlewaresDir = `${srcDir}/middlewares`
    const routesDir = `${srcDir}/routes`
    let projectName = process.cwd()
    projectName = projectName.split('\\')
    projectName = projectName[projectName.length - 1]
    
    let all = true
    
    if (!fs.existsSync(srcDir)) all = false
    if (!fs.existsSync(modelsDir)) all = false
    if (!fs.existsSync(controllersDir)) all = false
    if (!fs.existsSync(routesDir)) all = false
    
    if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')

    models.forEach(model => {
        fs.writeFileSync(`${modelsDir}/${model.name}.js`, apiTemplates.modelTemplate(model.name, model.fields))
        if (model.auth) {
            fs.writeFileSync(`${controllersDir}/${model.name}.js`, apiTemplates.authUserControllerTemplate(model.name, model.fields))
        } else {
            fs.writeFileSync(`${controllersDir}/${model.name}.js`, apiTemplates.controllerTemplate(model.name, model.fields))
        }
        fs.writeFileSync(`${routesDir}/${model.name}.js`, apiTemplates.routeTemplate(model.name))
        fs.writeFileSync(`${routesDir}/routes.js`, overwriteRoutes(routesDir, model.name))
    })

    fs.writeFileSync(`.env`, overwriteEnv('.env'))
    fs.writeFileSync(`${configDir}/app.js`, overwriteConfig(configDir))
    fs.writeFileSync(`${controllersDir}/auth.js`, apiTemplates.authControllerTemplate())
    fs.writeFileSync(`${routesDir}/auth.js`, apiTemplates.authRouteTemplate())
    fs.writeFileSync(`${controllersDir}/utils.js`, overwriteUtils(controllersDir))
    if (!fs.existsSync(middlewaresDir)) fs.mkdirSync(middlewaresDir)
    fs.writeFileSync(`${middlewaresDir}/session.js`, apiTemplates.sessionTemplate())
    
    // bcryptInstall(projectName)

    console.log(`Authentication system created successfully!!`)
} catch (error) {
    console.log(error)
}