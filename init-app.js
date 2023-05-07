#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const fs = require('fs')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function createApiProject() {
    try {
        msn('COYOTE-CLI')

        if (process.argv.length > 3) throw { coyote: true, msg: `${chalk.red.bold('Coyote Error:')} coyote cli does not recognize the argument ${process.argv[3]}` }
        
        const basic_path = process.cwd()
        const projectName = process.argv[2]

        let settings = {
            name: projectName,
            plugins: {},
            dependencies: []
        }

        if (!fs.existsSync(`${basic_path}/${projectName}`)) {
            fs.mkdirSync(`${basic_path}/${projectName}`)
        } else {
            throw { coyote: true, msg: `${chalk.red.bold('Coyote Error:')} A project with this name already exist in this root.` }
        }

        fs.writeFileSync(`${basic_path}/${projectName}/settings.json`, JSON.stringify(settings, null, 2))

        console.log(chalk.green.bold('App initialized successfully.'))
    } catch (error) {
        if (error.coyote) {
            console.log(error.msg)
        } else {
            console.error(error)
        }
    }
}

(async () => {
    createApiProject()
})()