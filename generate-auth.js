#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
const pgApiTemplates = require('./templates/api/postgres/templates')
const cryptoRandomString = require('crypto-random-string')
const { spawn } = require('child_process')
const utils = require('./controllers/utils')

function queryParams() {
    const qs = [
        {
            name: 'authType',
            type: 'list',
            message: 'Select the type of authenticate: ',
            choices: [
                'cookies',
                'bearer'
            ]
        }
    ];
    return inquirer.prompt(qs);
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
    })
}

function cookieParserInstall() {
    console.log('Installing cookie-parser...')
    
    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const child = spawn(command, ['install', 'cookie-parser'], { cwd: process.cwd(), stdio: 'inherit' })

    child.on('close', async function (code) {
        console.log(`Package cookie-parser successfully!!`)
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
    })
}

async function encrypt() {
    try {
        let password = cryptoRandomString({length: 16, type: 'alphanumeric'})
        const encryptPwd = await utils.encryptPwd(password)
    
        return { password, encryptPwd }
    } catch (error) {
        return null
    }
}

async function createQueriesTXT(api, dbName, password) {

    if (api == 'postgres') {

        const query = `WITH roles AS (
    INSERT INTO public.roles
        (name, "createdAt", "updatedAt")
    VALUES
        ('master', NOW(), NOW())
    RETURNING id),
    permissions AS (
    INSERT INTO public.permissions
        (path, "createdAt", "updatedAt", "role")
    SELECT '/', NOW(), NOW(), id FROM roles
    RETURNING id
    )
    INSERT INTO public.users
    (username, email, password, "createdAt", "updatedAt", "user_role")
    SELECT 'master', 'your_email', '${password}', NOW(), NOW(), id FROM roles;`
    
        fs.writeFileSync(`${process.cwd()}/queries.txt`, query)

    } else if (api == 'mongo') {

        const query = `use ${dbName}

db.roles.insertOne(
    {
        name: "master",
        permissions: ["/"]
    }
)

db.users.insertOne(
    {
        first_name: "Your first name",
        last_name: "Your last name",
        username: "Your username",
        email: "master@domain.com",
        password: "${password}",
        role: "The role uuid"
    }
)`

        fs.writeFileSync(`${process.cwd()}/queries.txt`, query)

    }
}

async function createAuthFunctions(data) {
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
        
        let api = null
        let apiTemplates = null
    
        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) {
            api = 'mongo'
            apiTemplates = mongoApiTemplates

            settings.models['auth'] = {}
            settings.models['role'] = {
                fields: {
                    name: { type: 'String', required: true },
                    permissions: { type: 'Array', contentType: 'String', required: true }
                }
            }

            settings.models['user'] = {
                fields: {
                    first_name: { type: 'String', required: true },
                    last_name: { type: 'String', required: true },
                    username: { type: 'String', required: true },
                    email: { type: 'String', required: true },
                    password: { type: 'String', hidden: true, required: true },
                    role: { type: 'ObjectId', ref: 'role', required: true }
                },
                auth: true
            }
    
            models = ['role', 'user']
    
            for (let modelName of models) {
                fs.writeFileSync(`${modelsDir}/${modelName}.js`, apiTemplates.modelTemplate(modelName, settings.models[modelName]))
                fs.writeFileSync(`${middlewaresDir}/${modelName}.js`, apiTemplates.middlewareTemplate(settings.models[modelName]))
                fs.writeFileSync(`${controllersDir}/${modelName}.js`, apiTemplates.controllerTemplate(modelName))
                fs.writeFileSync(`${routesDir}/${modelName}.js`, apiTemplates.routeTemplate(modelName, settings.models))
            }
        } else if (fs.existsSync(`${modulsDir}/pgConnection.js`)) {
            api = 'postgres'
            apiTemplates = pgApiTemplates
    
            settings.models['auth'] = {}
    
            models = [
                {
                    name: 'user',
                    fields: [
                        { name: 'username', type: 'TEXT', label: 'Username' },
                        { name: 'email', type: 'TEXT', unique: true, label: 'Email' },
                        { name: 'password', type: 'TEXT', label: 'Password' }
                    ],
                    relation: 'One-to-One',
                    reference: { model: 'role', name: 'user_role', label: 'Role' },
                    encrypt: ['password']
                },
                {
                    name: 'role',
                    fields: [
                        { name: 'name', type: 'TEXT', label: 'Name' }
                    ],
                    encrypt: []
                },
                {
                    name: 'permissions',
                    fields: [
                        { name: 'path', type: 'TEXT', label: 'Path' }
                    ],
                    relation: 'One-to-Many',
                    reference: { model: 'role', name: 'role', label: 'Role' },
                    encrypt: []
                }
            ]
    
            models.forEach(model => {
                settings.models[model.name] = {}
                settings.models[model.name]['fields'] = model.fields
                
                if (model.reference) {
                    let obj = {
                        name: model.reference.model,
                        relationType: model.relation,
                        alias: model.reference.name,
                        showModelInfo: true,
                        label: model.reference.label,
                        validations: { isInt: true }
                    }

                    if (model.name == 'permissions') obj.compound = true
                    
                    settings.models[model.name]['foreignKeys'] = [obj]
                }
    
                if (model.encrypt.length) settings.models[model.name]['encryptFields'] = model.encrypt
            })

            models.forEach(model => {
                fs.writeFileSync(`${modelsDir}/${model.name}.js`, apiTemplates.modelTemplate(model.name, settings.models))
                fs.writeFileSync(`${controllersDir}/${model.name}.js`, apiTemplates.controllerTemplate(model.name, settings.models))
                fs.writeFileSync(`${routesDir}/${model.name}.js`, apiTemplates.routeTemplate(model.name, settings.models))
            })
    
            fs.writeFileSync(`${modelsDir}/fields.virtuals.js`, apiTemplates.virtualsTemplate(settings.models))
        }

        settings.authenticationApp = true
        let existAccess = false
        let existRefresh = false
        let existMode = false
        let existUrlOrigin = false

        settings.enviromentKeyValues.forEach(el => {
            if (el.name == 'ACCESS_TOKEN_SECRET') existAccess = true
            if (el.name == 'REFRESH_TOKEN_SECRET') existRefresh = true
            if (el.name == 'MODE') existMode = true
            if (el.name == 'URL_ORIGIN_DEV') existUrlOrigin = true
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

        if (!existMode) {
            settings.enviromentKeyValues.push({
                name: 'MODE',
                value: 'developer'
            })
        }

        if (!existUrlOrigin) {
            settings.enviromentKeyValues.push({
                name: 'URL_ORIGIN_DEV',
                value: 'http://localhost:8080'
            })
        }
    
        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings, null, 2))
    
        fs.writeFileSync(`${dir}.env`, apiTemplates.envTemplate(settings.enviromentKeyValues))
        fs.writeFileSync(`${configDir}/app.js`, apiTemplates.configTemplate(settings.enviromentKeyValues))
        fs.writeFileSync(`${modelsDir}/virtuals.js`, apiTemplates.virtualsTemplate(settings.models))
        fs.writeFileSync(`${routesDir}/routes.js`, apiTemplates.routesTemplate(settings.models))
        fs.writeFileSync(`${controllersDir}/utils.js`, apiTemplates.utilsTemplate(true))
        fs.writeFileSync(`${middlewaresDir}/session.js`, apiTemplates.sessionTemplate(data.authType))
        fs.writeFileSync(`${dir}app.js`, apiTemplates.appTemplate(settings, data.authType))
        fs.writeFileSync(`${dir}.gitignore`, apiTemplates.gitignoreTemplate(true))
        fs.writeFileSync(`${controllersDir}/auth.js`, apiTemplates.authControllerTemplate(data.authType))
        fs.writeFileSync(`${routesDir}/auth.js`, apiTemplates.authRouteTemplate())
    
        let packageContent = fs.readFileSync(`${dir}package.json`)
        let package = JSON.parse(packageContent)
        
        if (!package.dependencies.bcrypt) bcryptInstall()
        if (!package.dependencies.jsonwebtoken) jsonwebtokenInstall()
        if (!package.dependencies['cookie-parser']) cookieParserInstall()

        //History models
        // Object.keys(settings.models).forEach(model => {
        //     if (model != 'auth') {
        //         let historyModel = {...settings.models[model]}

        //         if (historyModel.foreignKeys) {
        //             for (let fk of historyModel.foreignKeys) {
        //                 historyModel.fields.push({
        //                     name: fk.alias,
        //                     type: 'INTEGER',
        //                     label: fk.label,
        //                     validations: fk.validations,
        //                     position: fk.position
        //                 })
        //             }
                    
        //             historyModel.fields.push({
        //                 name: 'user',
        //                 type: 'INTEGER',
        //                 label: 'User',
        //                 validations: { isInt: true },
        //                 position: historyModel.fields.length + 1
        //             })

        //             delete historyModel.foreignKeys

        //             settings.models[`${model}_history`] = {...historyModel}
        //         } else {
        //             settings.models[`${model}_history`] = {...settings.models[model]}
        //         }

        //         historyModel.fields.push({
        //             name: 'identifier',
        //             type: 'INTEGER',
        //             label: 'Identifier',
        //             validations: { isInt: true },
        //             position: historyModel.fields.length + 1
        //         })

        //         historyModel.fields.push({
        //             name: 'action',
        //             type: 'TEXT',
        //             label: 'Action',
        //             position: historyModel.fields.length + 1
        //         })

        //         fs.writeFileSync(`${modelsDir}/${model}_history.js`, apiTemplates.modelTemplate(`${model}_history`, settings.models))
        //         fs.writeFileSync(`${controllersDir}/${model}_history.js`, apiTemplates.controllerTemplate(`${model}_history`, settings.models))
        //         fs.writeFileSync(`${routesDir}/${model}_history.js`, apiTemplates.routeTemplate(`${model}_history`, settings.models))

        //         fs.writeFileSync(`${controllersDir}/${model}.js`, pgApiTemplates.controllerTemplate(model, settings.models))
        //     }
        // })

        // fs.writeFileSync(`${routesDir}/routes.js`, apiTemplates.routesTemplate(settings.models))
    
        console.log(`Authentication system created successfully!!`)

        envDb = settings.enviromentKeyValues.find(item => item.name == 'MONGO_DATABASE')
        const resPass = await encrypt()
        
        if (resPass) {
            console.log(`WARNING: This is your password, you can change it later: ${resPass.password} ${chalk.cyan('<-------')}`)
            createQueriesTXT(api, envDb.value, resPass.encryptPwd)
        }
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    createAuthFunctions(await queryParams())
})()