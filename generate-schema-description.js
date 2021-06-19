#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const fs = require('fs')
const utils = require('./controllers/utils')
const pgApiTemplates = require('./templates/api/postgres/templates')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function getSchema() {
    const settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
    const settings = JSON.parse(settingContent)
    const modelList = Object.keys(settings.models)

    const qs = [
        {
            name: 'schemaName',
            type: 'list',
            message: 'Select schema: ',
            choices: modelList
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

function setReferenceFields(reference, model) {
    let referenceFieldsContent = fs.readFileSync(`${process.cwd()}/referenceFields.txt`, { encoding: 'utf8', flag: 'r' }).split('\n')
    if (referenceFieldsContent.length && referenceFieldsContent[0] == '') referenceFieldsContent.splice(0, 1)

    referenceFieldsContent.push(`${reference},${model}`)

    let template = ''
    referenceFieldsContent.forEach((line, i) => {
        if (i == referenceFieldsContent.length - 1) {
            template += `${line}`
        } else {
            template += `${line}\n`
        }
    })

    return template
}

function getReferenceFields(model) {
    let referenceFieldsContent = fs.readFileSync(`${process.cwd()}/referenceFields.txt`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let foreignKeys = []
    let arraylLines = []
    let words = []
    let fk = ''

    referenceFieldsContent.forEach(line => arraylLines.push(line.split(',')))

    let lines = [...referenceFieldsContent]

    arraylLines.forEach((line, i) => {
        if (line[1] == model) {
            fk = line[0]
            words = fk.split('_')

            if (words.length > 1) {
                for (let i=0; i<words.length; i++) {
                    if (i === 0) words[0] = words[0].toLowerCase()
                    if (i > 0) words[i] = words[i].capitalize()
                }
                fk = ''
                words.forEach(word => fk += word)
            }

            fk += 'Id'

            foreignKeys.push(fk)
            lines.splice(i, 1)
        }
    })

    if (!lines.length) fs.unlinkSync(`${process.cwd()}/referenceFields.txt`)

    return foreignKeys
}

function getFields(dir, schema, project) {
    let modelContent = fs.readFileSync(`${dir}/${schema}.js`, { encoding: 'utf8', flag: 'r' }).split('\n')
    let flag = false
    let fields = []
    let foreignKeys = []
    let settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
    let settings = JSON.parse(settingContent)
    
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
        }

        if (project == 'mongo') {
            if (modelContent[j].indexOf(`const ${schema}Schema`) > -1) flag = true
        }
    }

    if (project == 'postgres') {
        if (settings.models[schema]) {
            settings.models[schema].foreignKeys.forEach(key => {
                words = key.split('_')
                let fk = ''
    
                if (words.length > 1) {
                    for (let i=0; i<words.length; i++) {
                        if (i === 0) words[0] = words[0].toLowerCase()
                        if (i > 0) words[i] = words[i].capitalize()
                    }
                    
                    words.forEach(word => fk += word)
                } else {
                    fk = key
                }
    
                fk += 'Id'
    
                foreignKeys.push(fk)
            })
    
            foreignKeys.forEach(key => fields.push({ name: key.trim(), type: 'INTEGER' }))
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

        // if (fs.existsSync(`${modulsDir}/mongoConnection.js`)) project = 'mongo'
        // if (fs.existsSync(`${modulsDir}/pgConnection.js`)) project = 'postgres'

        let settingContent = fs.readFileSync(`${process.cwd()}/settings.json`)
        let settings = JSON.parse(settingContent)

        settings.models[schemaName]['activatedSchema'] = true
        let fields = settings.models[schemaName].fields

        for (let i=0; i<fields.length; i++) {
            const label = await setLabel(fields[i].name)
            fields[i]['label'] = label.label
        }

        fs.writeFileSync(`${dir}settings.json`, JSON.stringify(settings))
        
        fs.writeFileSync(`${controllersDir}/${schemaName}.js`, pgApiTemplates.controllerTemplate(schemaName, settings.models))
        fs.writeFileSync(`${routesDir}/${schemaName}.js`, pgApiTemplates.routeTemplate(schemaName, settings.models))
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    schemaDescription(await getSchema())
})()