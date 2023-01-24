#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const mongoApiTemplates = require('./templates/api/mongodb/templates')
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
    
        if (settings.databaseType == 'mongodb') {
            api = 'mongo'

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
                fs.writeFileSync(`${modelsDir}/${modelName}.js`, mongoApiTemplates.modelTemplate(modelName, settings.models[modelName]))
                fs.writeFileSync(`${middlewaresDir}/${modelName}.js`, mongoApiTemplates.middlewareTemplate(settings.models[modelName], modelName))
                fs.writeFileSync(`${controllersDir}/${modelName}.js`, mongoApiTemplates.controllerTemplate(modelName, settings.models[modelName]))
                fs.writeFileSync(`${routesDir}/${modelName}.js`, mongoApiTemplates.routeTemplate(modelName, settings.models))
                fs.writeFileSync(`${testsDir}/${modelName}.test.js`, mongoApiTemplates.testTemplate(modelName, settings.models, settings.authenticationApp))
            }

            Object.keys(settings.models).forEach(modelName => {
                if (modelName != 'auth') fs.writeFileSync(`${testsDir}/${modelName}.test.js`, mongoApiTemplates.testTemplate(modelName, settings.models, settings.authenticationApp))
            })

            fs.writeFileSync(`${testsDir}/health.test.js`, mongoApiTemplates.healthTestTemplate(settings.authenticationApp))
        }

        let existMongoDatabase = false
        let existAccess = false
        let existRefresh = false
        let existUrlOrigin = false
        let existTestUsername = false
        let existSignUpDefaultRole = false

        settings.environmentKeyValues.forEach(el => {
            if (el.name == 'MONGO_DATABASE') existAccess = true
            if (el.name == 'ACCESS_TOKEN_SECRET') existAccess = true
            if (el.name == 'REFRESH_TOKEN_SECRET') existRefresh = true
            if (el.name == 'URL_ORIGIN_DEV') existUrlOrigin = true
            if (el.name == 'TEST_USERNAME') existTestUsername = true
            if (el.name == 'SIGNUP_DEFAULT_ROLE') existTestUsername = true
        })
        
        if (!existMongoDatabase) {
            settings.environmentKeyValues.push({
                name: 'MONGO_DATABASE',
                value: settings.name
            })
        }
        
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

        if (!existSignUpDefaultRole) {
            settings.environmentKeyValues.push({
                name: 'SIGNUP_DEFAULT_ROLE',
                value: 'master'
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
    
        fs.writeFileSync(`${dir}.env`, mongoApiTemplates.envTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${dir}.env-example`, mongoApiTemplates.envExampleTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${configDir}/app.js`, mongoApiTemplates.configTemplate(settings.environmentKeyValues))
        fs.writeFileSync(`${routesDir}/routes.js`, mongoApiTemplates.routesTemplate(settings.models))
        fs.writeFileSync(`${helpersDir}/encrypt.js`, mongoApiTemplates.encryptHelperTemplate())
        fs.writeFileSync(`${middlewaresDir}/session.js`, mongoApiTemplates.sessionTemplate(settings.authType))
        fs.writeFileSync(`${dir}app.js`, mongoApiTemplates.appTemplate(settings))
        fs.writeFileSync(`${dir}.gitignore`, mongoApiTemplates.gitignoreTemplate(true))
        fs.writeFileSync(`${controllersDir}/auth.js`, mongoApiTemplates.authControllerTemplate(settings.authType))
        fs.writeFileSync(`${routesDir}/auth.js`, mongoApiTemplates.authRouteTemplate(settings.authType))
    
        let packageContent = fs.readFileSync(`${dir}package.json`)
        let package = JSON.parse(packageContent)
        
        if (!package.dependencies.bcrypt) bcryptInstall()
        if (!package.dependencies.jsonwebtoken) jsonwebtokenInstall()
        if (!package.dependencies['cookie-parser']) cookieParserInstall()

        if (resPass) createQueriesTXT(api, settings, resPass)

        console.log(`Authentication system created successfully!!`)
        
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    createAuthFunctions(await queryParams())
})()