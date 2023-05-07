#!/usr/bin/env node

const chalk = require('chalk')
const figlet = require('figlet')
const fs = require('fs')
const dependencies = require('./config/dependencies')
const versionHelpper = require('./helppers/version')
const { spawn } = require('child_process')

function msn(msn) {
    console.log(chalk.bold.cyan(figlet.textSync(msn, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })))
}

function npmInstallGlobalDependencies(dependencies) {
    console.log('Installing global dependencies...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const commands = ['install'].concat(dependencies)
    commands.push('-g')
    const child = spawn(command, commands)

    child.on('close', function (code) {
        console.log(`Global dependencies installed successfully.`)
    })
}

function npmInstallLocalDependencies(dependencies) {
    console.log('Installing local dependencies...')

    let command = ''
    if (process.platform == 'win32') {
        command = 'npm.cmd'
    } else {
        command = 'npm'
    }

    const commands = ['install'].concat(dependencies)
    const child = spawn(command, commands, { cwd: process.cwd(), stdio: 'inherit' })

    child.on('close', function (code) {
        console.log(`Local dependencies installed successfully.`)
    })
}

function createApiProject() {
    try {
        msn('COYOTE-CLI')

        const basic_path = process.cwd()
        const settingsDir = `${basic_path}/settings.json`

        if (!fs.existsSync(settingsDir)) {
            throw { coyote: true, msg: `${chalk.red.bold('Coyote Error:')} A project created with coyote-cli must have a 'settings.json' file.` }
        }
        
        let settingContent = fs.readFileSync(settingsDir)
        let settings = JSON.parse(settingContent)

        if (process.argv.length < 3) throw { coyote: true, msg: `${chalk.red.bold('Coyote Error:')} No dependency added.` }

        for (let i=2; i<process.argv.length; i++) {
            const nameDivided = process.argv[i].split('@')
            let version = 'lts'
            const depName = nameDivided[0]

            if (nameDivided.length > 1) {
                const verifiedVersion = versionHelpper.verifyVersion(nameDivided[1])
                if (!verifiedVersion) {
                    throw { coyote: true, msg: `${chalk.red.bold('Coyote Error:')} The version of ${depName} is not well defined.` }
                }

                version = verifiedVersion
            }

            if (!settings.dependencies.find(el => el.name === depName)) {
                const dependency = dependencies.find(item => item.name === depName)
                if (!dependency) throw { coyote: true, msg: `${chalk.red.bold('Coyote Error:')} ${depName} dependency is not recognized.` }

                settings.dependencies.push(dependency)
            }

            if (!Object.keys(settings.plugins).includes(`@coyote-cli/${depName}-plugin`)) settings.plugins[`@coyote-cli/${depName}-plugin`] = version
        }

        

        const globalDependencies = Object.keys(settings.plugins)
        npmInstallGlobalDependencies(globalDependencies)

        const localDependencies = []

        for (const dependency of settings.dependencies) {
            localDependencies.push(dependency.name)
            for (const dep of Object.keys(dependency.settings)) {
                if (dependency.settings[dep]) {
                    if (dependency.dependencies[dep] != 'lts') {
                        localDependencies.push(`${dep}@${dependency.dependencies[dep]}`)
                    } else {
                        localDependencies.push(dep)
                    }
                }
            }
        }

        npmInstallLocalDependencies(localDependencies)

        fs.writeFileSync(settingsDir, JSON.stringify(settings, null, 2))
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