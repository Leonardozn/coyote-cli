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

async function createQueriesTXT(api, settings, resPass) {

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
    SELECT 'master', 'your_email', '${resPass.encryptPwd}', NOW(), NOW(), id FROM roles;`
    
        fs.writeFileSync(`${process.cwd()}/queries.txt`, query)

    } else if (api == 'mongo') {
        const envDb = settings.environmentKeyValues.find(item => item.name == 'MONGO_DATABASE')

        const query = `use ${envDb.value}

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
        username: "admin",
        email: "master@domain.com",
        password: "${resPass.encryptPwd}",
        role: ObjectId("The role uuid")
    }
)`

        fs.writeFileSync(`${process.cwd()}/queries.txt`, query)

    }
    
    console.log(`${chalk.black.bgYellow('WARNING')}: This is your password, you can change it later: ${resPass.password} ${chalk.cyan('<-------')}`)
}

async function createAuthFunctions(data) {
    try {
        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const configDir = `${srcDir}/config`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        const helpersDir = `${srcDir}/helpers`
        const middlewaresDir = `${srcDir}/middlewares`
        const routesDir = `${srcDir}/routes`
        const modulsDir = `${srcDir}/modules`
        const testsDir = `${dir}/tests`
        
        let all = true
        
        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulsDir)) all = false
        if (!fs.existsSync(testsDir)) all = false
        
        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
    
        console.log(chalk.bold.cyan(figlet.textSync('COYOTE-CLI', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        })))
    
        let settingContent = fs.readFileSync(`${dir}settings.json`)
        let settings = JSON.parse(settingContent)
        settings.authenticationApp = true
        settings.authType = data.authType
    
        let models = []
        
        let api = null
        let apiTemplates = null
    
        if (settings.databaseType == 'mongodb') {
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
                    email: { type: 'String', required: true, isEmail: true },
                    password: { type: 'String', hidden: true, required: true },
                    role: { type: 'ObjectId', ref: 'role', required: true }
                },
                auth: true
            }
    
            models = ['role', 'user']
    
            for (let modelName of models) {
                fs.writeFileSync(`${modelsDir}/${modelName}.js`, apiTemplates.modelTemplate(modelName, settings.models[modelName]))
                fs.writeFileSync(`${middlewaresDir}/${modelName}.js`, apiTemplates.middlewareTemplate(settings.models[modelName]))
                fs.writeFileSync(`${controllersDir}/${modelName}.js`, apiTemplates.controllerTemplate(modelName, settings.models[modelName]))
                fs.writeFileSync(`${routesDir}/${modelName}.js`, apiTemplates.routeTemplate(modelName, settings.models))
                fs.writeFileSync(`${testsDir}/${modelName}.test.js`, apiTemplates.testTemplate(modelName, settings.models, settings.authenticationApp))
            }

            Object.keys(settings.models).forEach(modelName => {
                if (modelName != 'auth') fs.writeFileSync(`${testsDir}/${modelName}.test.js`, apiTemplates.testTemplate(modelName, settings.models, settings.authenticationApp))
            })

            fs.writeFileSync(`${testsDir}/health.test.js`, apiTemplates.healthTestTemplate(settings.authenticationApp))
        } else {
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

        let existAccess = false
        let existRefresh = false
        let existUrlOrigin = false
        let existTestUsername = false

        settings.environmentKeyValues.forEach(el => {
            if (el.name == 'ACCESS_TOKEN_SECRET') existAccess = true
            if (el.name == 'REFRESH_TOKEN_SECRET') existRefresh = true
            if (el.name == 'URL_ORIGIN_DEV') existUrlOrigin = true
            if (el.name == 'TEST_USERNAME') existTestUsername = true
        })
        
        if (!existAccess) {
            settings.environmentKeyValues.push({
                name: 'ACCESS_TOKEN_SECRET',
                value: cryptoRandomString({length: 22, type: 'alphanumeric'})
            })
        }
        
        if (!existRefresh) {
            settings.environmentKeyValues.push({
                name: 'REFRESH_TOKEN_SECRET',
                value: cryptoRandomString({length: 22, type: 'alphanumeric'})
            })
        }

        if (!existUrlOrigin) {
            settings.environmentKeyValues.push({
                name: 'URL_ORIGIN_DEV',
                value: 'http://localhost:8080'
            })
        }

        if (!existTestUsername) {
            settings.environmentKeyValues.push({
                name: 'TEST_USERNAME',
                value: 'admin'
            })
        }

        const resPass = await encrypt()
        const index = settings.environmentKeyValues.findIndex(item => item.name == 'TEST_PASSWORD')
        
        if (index > -1) {
            settings.environmentKeyValues[index].value = resPass.password
        } else {
            settings.environmentKeyValues.push({
                name: 'TEST_PASSWORD',
                value: resPass.password
            })
        }
    
        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings, null, 2))
    
        fs.writeFileSync(`${dir}.env`, apiTemplates.envTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${dir}.env-example`, apiTemplates.envExampleTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${configDir}/app.js`, apiTemplates.configTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${routesDir}/routes.js`, apiTemplates.routesTemplate(settings.models))
        fs.writeFileSync(`${helpersDir}/encrypt.js`, apiTemplates.encryptHelperTemplate())
        fs.writeFileSync(`${middlewaresDir}/session.js`, apiTemplates.sessionTemplate(settings.authType))
        fs.writeFileSync(`${dir}app.js`, apiTemplates.appTemplate(settings))
        fs.writeFileSync(`${dir}.gitignore`, apiTemplates.gitignoreTemplate(true))
        fs.writeFileSync(`${controllersDir}/auth.js`, apiTemplates.authControllerTemplate(settings.authType))
        fs.writeFileSync(`${routesDir}/auth.js`, apiTemplates.authRouteTemplate(settings.authType))
    
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

        if (resPass) createQueriesTXT(api, settings, resPass)

        console.log(`Authentication system created successfully!!`)
        
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    createAuthFunctions(await queryParams())
})()