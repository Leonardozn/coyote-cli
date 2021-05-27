#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const utils = require('./controllers/utils')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function getSchema() {
    const qs = [
        {
            name: 'schemaName',
            type: 'input',
            message: 'Schema name: '
        }
    ]

    return inquirer.prompt(qs)
}

function setLabel(field) {
    const qs = [
        {
            name: 'label',
            type: 'input',
            message: `Set the label to "${field}" field: `
        }
    ]

    return inquirer.prompt(qs)
}

function getFields(dir, schema, project) {
    let modelContent = fs.readFileSync(`${dir}/${schema}.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let flag = false
    let fields = []
    
    for (let j=0; j<modelContent.length; j++) {
        if (project == 'postgres' && modelContent[j].indexOf(`})`) > -1) flag = false
        if (project == 'mongo' && modelContent[j].indexOf(`})`) > -1) break

        if (flag) {
            let chars = modelContent[j].split('')
            let field = ''
            for (let i=0; i<chars.length; i++) {
                if (chars[i] !== ':') {
                    field += chars[i]  
                } else {
                    break
                }
            }

            let type = ''
            let typeIndex = 0

            if (project == 'postgres') {
                typeIndex = modelContent[j].indexOf('DataTypes') + 10 //"DataTypes" string length plus 1 ("." char)
            } else if (project == 'mongo') {
                typeIndex = modelContent[j].indexOf('type:') + 5 //"type:" string length
            }

            for (let i=typeIndex; i<chars.length; i++) {
                if (chars[i] !== '}' && chars[i] !== ',') {
                    type += chars[i]
                } else {
                    break
                }
            }

            if (type.trim() == 'Schema.Types.ObjectId') type = 'ObjectId'
            
            fields.push({ name: field.trim(), type: type.trim() })
        }

        if (project == 'postgres') {
            if (modelContent[j].indexOf(`const ${schema.capitalize()}`) > -1) flag = true
            
            if (modelContent[j].indexOf(`${schema.capitalize()}.hasOne`) > -1) {
                let index = modelContent[j].indexOf('(')
                let fk = modelContent[j].substring(index + 1, modelContent[j].length - 1)
    
                let words = fk.split('_')
                if (words.length > 1) {
                    for (let i=0; i<words.length; i++) {
                        if (i === 0) words[0] = words[0].toLowerCase()
                        if (i > 0) words[i] = words[i].capitalize()
                    }
                    fk = ''
                    words.forEach(word => fk += word)
                } else {
                    fk = fk.toLowerCase()
                }
                fk += 'Id'
    
                fields.push({ name: fk, type: 'INTEGER' })
            }
        }

        if (project == 'mongo') {
            if (modelContent[j].indexOf(`const ${schema}Schema`) > -1) flag = true
        }
    }

    return fields
}

function overwriteRoute(dir, model) {
    let routeContent = fs.readFileSync(`${dir}/${model}.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true

    routeContent.forEach(line => {
        if (line.indexOf(`${model}Ctrl.options`) > -1) overwrite = false
    })

    if (overwrite) {
        let lines = routeContent.map(item => item)

        routeContent.forEach((line, i) => {
            if (line.indexOf('return router') > -1) {
                lines.splice(i - 1, 0, `    router.get('/${model}/schema', ${model}Ctrl.options) //get schema description`)
            }
        })

        routeContent = lines.map(item => item)
    }

    let template = ''
    routeContent.forEach(line => template += `${line}\n`)

    return template
}

function overwriteController(dir, schema, fields, project) {
    let controllerContent = fs.readFileSync(`${dir}/${schema}.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let overwrite = true
    let flag = false

    controllerContent.forEach(line => {
        if (line.indexOf(`function schemaDesc`) > -1) overwrite = false
    })

    if (overwrite) {
        let lines = controllerContent.map(item => item)

        controllerContent.forEach((line, i) => {
            if (line.indexOf('function selectById') > -1) flag = true

            if (flag) {
                if (line.indexOf('res.status(200).send') > -1) {
                    if (project == 'postgres') {
                        lines[i] = `        res.status(200).send({ schema: schemaDesc(), data: ${schema} })`
                    }

                    if (project == 'mongo') {
                        lines[i] = `        res.status(200).send({ schema: schemaDesc(), data: ${schema}.view })`
                    }
                }
            }

            if (line === '}') flag = false
        })

        controllerContent = lines.map(item => item)

        controllerContent.forEach((line, i) => {
            if (line.indexOf('function list') > -1) flag = true

            if (flag) {
                if (line.indexOf('res.status(200).send') > -1) {
                    if (project == 'postgres') {
                        lines[i] = `        .then(${schema}_list => res.status(200).send({ schema: schemaDesc(), amount: ${schema}_list.length, data: ${schema}_list }))`
                    }

                    if (project == 'mongo') {
                        lines[i] = `        res.status(200).send({ schema: schemaDesc(), amount: ${schema}_list.length, data: ${schema}_list })`
                    }
                }
            }

            if (line === '}') flag = false
        })

        controllerContent = lines.map(item => item)

        controllerContent.forEach((line, i) => {
            if (line.indexOf('module.exports') > -1) {
                lines.splice(i, 0, 'function options(req, res, next) {')
                lines.splice(i + 1, 0, `    res.status(200).send({ data: schemaDesc() })`)
                lines.splice(i + 2, 0, `}\n`)
            }
        })

        controllerContent = lines.map(item => item)

        for (let i=0; i<controllerContent.length; i++) {
            if (controllerContent[i].indexOf('module.exports') > -1) {
                let count = 0
                lines.splice(i, 0, `function schemaDesc() {`)
                lines.splice(i + (count+=1), 0, `    const schemaDesc = {`)

                for (let j=0; j<fields.length; j++) {
                    if (j == fields.length - 1) {
                        lines.splice(i + (count+=1), 0, `        ${fields[j].name}: { type: '${fields[j].type}', label: '${fields[j].label}' }`)
                    } else {
                        lines.splice(i + (count+=1), 0, `        ${fields[j].name}: { type: '${fields[j].type}', label: '${fields[j].label}' },`)
                    }
                }
                
                lines.splice(i + (count+=1), 0, `    }\n`)
                lines.splice(i + (count+=1), 0, `    return schemaDesc`)
                lines.splice(i + (count+=1), 0, `}\n`)
            }
        }

        controllerContent = lines.map(item => item)

        controllerContent.forEach((line, i) => {
            if (line.indexOf('module.exports') > -1) flag = true
            if (line.indexOf('}') > -1 && flag) {
                lines[i-1] += ','
                lines.splice(i, 0, '    options')
            }
        })

        controllerContent = lines.map(item => item)
    }

    let template = ''
    controllerContent.forEach(line => template += `${line}\n`)

    return template
}

async function schemaDescription(data) {
    msn('COYOTE-CLI')

    try {
        const schemaName = data.schemaName.toLowerCase()

        const dir = `${process.cwd()}/`
        const srcDir = `${dir}/src`
        const modelsDir = `${srcDir}/models`
        const controllersDir = `${srcDir}/controllers`
        const routesDir = `${srcDir}/routes`
        const modulsDir = `${srcDir}/modules`
        
        let all = true

        if (!fs.existsSync(srcDir)) all = false
        if (!fs.existsSync(modelsDir)) all = false
        if (!fs.existsSync(controllersDir)) all = false
        if (!fs.existsSync(routesDir)) all = false
        if (!fs.existsSync(modulsDir)) all = false

        if (all === false) throw new Error('This project does not have the correct "coyote-cli" structure.')
        if (!fs.existsSync(`${modelsDir}/${schemaName}.js`)) throw new Error('The schema you indicated does not exist.')

        let fields = []
        let project = ''
        if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        const list = getFields(modelsDir, schemaName, project)
        
        for (let i=0; i<list.length; i++) {
            const label = await setLabel(list[i].name)
            fields.push({ name: list[i].name, type: list[i].type, label: label.label })
        }
        
        fs.writeFileSync(`${controllersDir}/${schemaName}.js`, overwriteController(controllersDir, schemaName, fields, project))
        fs.writeFileSync(`${routesDir}/${schemaName}.js`, overwriteRoute(routesDir, schemaName))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    schemaDescription(await getSchema())
})()