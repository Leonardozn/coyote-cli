#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
const pgApiTemplates = require('./templates/api/postgres/templates')
const cryptoRandomString = require('crypto-random-string')
const { spawn } = require('child_process')
const utils = require('./controllers/utils')

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

function jsonwebtokenInstall() {
    console.log('Installing jsonwebtoken...')
    
    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'jsonwebtoken'], { cwd: process.cwd(), stdio: 'inherit' })

    child.on('close', async function (code) {
        console.log(`Package jsonwebtoken successfully!!`)
        console.log(`Authentication system created successfully!!`)

        const password = await createQueriesTXT()
        console.log(`WARNING: This is your password, you can change it later: ${password} ${chalk.cyan('<-------')}`)
    })
}

function bcryptInstall() {
    console.log('Installing bcrypt...')
    
    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'bcrypt'], { cwd: process.cwd(), stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`Package installed successfully!!`)
        jsonwebtokenInstall()
    })
}

async function encrypt() {
    let password = cryptoRandomString({length: 16, type: 'alphanumeric'})
    const encryptPwd = await utils.encryptPwd(password)

    return { password, encryptPwd }
}

async function createQueriesTXT() {
    const pass = await encrypt()

    const query = `WITH permissions AS (
    INSERT INTO public.permissions
        (path, "createdAt", "updatedAt")
    VALUES
        ('/', NOW(), NOW())
    RETURNING id),
    roles AS (
    INSERT INTO public.roles
        (name, "createdAt", "updatedAt", "permissionId")
    SELECT 'master', NOW(), NOW(), id FROM permissions
    RETURNING id
    )
    INSERT INTO public.users
    (username, email, password, "createdAt", "updatedAt", "roleId")
    SELECT 'master', 'your_email', '${pass.encryptPwd}', NOW(), NOW(), id FROM roles;`

    fs.writeFileSync(`${process.cwd()}/queries.txt`, query)

    return pass.password
}

try {
    const dir = `${process.cwd()}/`
    const srcDir = `${dir}/src`
    const configDir = `${srcDir}/config`
    const modelsDir = `${srcDir}/models`
    const controllersDir = `${srcDir}/controllers`
    const middlewaresDir = `${srcDir}/middlewares`
    const routesDir = `${srcDir}/routes`
    const modulsDir = `${srcDir}/modules`
    
    let all = true
    
    if (!fs.existsSync(srcDir)) all = false
    if (!fs.existsSync(modelsDir)) all = false
    if (!fs.existsSync(controllersDir)) all = false
    if (!fs.existsSync(routesDir)) all = false
    if (!fs.existsSync(modulsDir)) all = false
    
    if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')

    console.log(chalk.bold.cyan(figlet.textSync('COYOTE-CLI', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))

    let settingContent = fs.readFileSync(`${dir}settings.json`)
    let settings = JSON.parse(settingContent)

    let models = []
    
    let apiTemplates = null

    if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) {
        apiTemplates = mongoApiTemplates

        models = [
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
    } else if (fs.existsSync(`${modulsDir}/pgConnection.js`)) {
        apiTemplates = pgApiTemplates

        settings.models['auth'] = {}

        models = [
            {
                name: 'user',
                fields: [
                    {name: 'username', type: 'TEXT', label: 'Username'},
                    {name: 'email', type: 'TEXT', unique: true, label: 'Email'},
                    {name: 'password', type: 'TEXT', label: 'Password'}
                ],
                relation: 'hasOne',
                reference: 'role',
                encrypt: ['password']
            },
            {
                name: 'role',
                fields: [
                    {name: 'name', type: 'TEXT', label: 'Name'}
                ],
                relation: 'hasMany',
                reference: 'permissions',
                encrypt: []
            },
            {
                name: 'permissions',
                fields: [
                    {name: 'path', type: 'TEXT', label: 'Path'}
                ],
                encrypt: []
            }
        ]

        models.forEach(model => {
            settings.models[model.name] = {}
            settings.models[model.name]['fields'] = model.fields
            
            if (model.reference) {
                settings.models[model.name]['foreignKeys'] = [{ name: model.reference, relationType: model.relation, showModelInfo: true }]
            }

            if (model.encrypt.length) settings.models[model.name]['encryptFields'] = model.encrypt
            
            fs.writeFileSync(`${modelsDir}/${model.name}.js`, apiTemplates.modelTemplate(model.name, settings.models))
            fs.writeFileSync(`${controllersDir}/${model.name}.js`, apiTemplates.controllerTemplate(model.name, settings.models))
            fs.writeFileSync(`${routesDir}/${model.name}.js`, apiTemplates.routeTemplate(model.name, settings.models))
        })

        settings.authenticationApp = true
        let existAccess = false
        let existRefresh = false

        settings.enviromentKeyValues.forEach(el => {
            if (el.name == 'ACCESS_TOKEN_SECRET') existAccess = true
            if (el.name == 'REFRESH_TOKEN_SECRET') existRefresh = true
        })
        
        if (!existAccess) {
            settings.enviromentKeyValues.push({
                name: 'ACCESS_TOKEN_SECRET',
                value: cryptoRandomString({length: 22, type: 'alphanumeric'})
            })
        }
        
        if (!existRefresh) {
            settings.enviromentKeyValues.push({
                name: 'REFRESH_TOKEN_SECRET',
                value: cryptoRandomString({length: 22, type: 'alphanumeric'})
            })
        }

        fs.writeFileSync(`${modelsDir}/fields.virtuals.js`, apiTemplates.virtualsTemplate(settings.models))
    }

    fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))

    fs.writeFileSync(`${dir}.env`, apiTemplates.envTemplate(settings.enviromentKeyValues))
    fs.writeFileSync(`${configDir}/app.js`, apiTemplates.configTemplate(settings.enviromentKeyValues))
    fs.writeFileSync(`${routesDir}/routes.js`, apiTemplates.routesTemplate(settings.models))
    fs.writeFileSync(`${controllersDir}/utils.js`, apiTemplates.utilsTemplate(true))
    if (!fs.existsSync(middlewaresDir)) fs.mkdirSync(middlewaresDir)
    fs.writeFileSync(`${middlewaresDir}/session.js`, apiTemplates.sessionTemplate())
    fs.writeFileSync(`${dir}app.js`, apiTemplates.appTemplate(settings))
    fs.writeFileSync(`${dir}.gitignore`, apiTemplates.gitignoreTemplate(true))
    fs.writeFileSync(`${controllersDir}/auth.js`, apiTemplates.authControllerTemplate())
    fs.writeFileSync(`${routesDir}/auth.js`, apiTemplates.authRouteTemplate())
    
    bcryptInstall()
} catch (error) {
    console.log(error)
}