function content(settings) {
    const projectName = settings.name
    const keyValues = settings.environmentKeyValues

    let template = `module.exports = {
    apps : [{
        name   : "${projectName}",
        script : "./index.js",
        watch: true,
        instances: 1,
        max_memory_restart: "1G",
        exec_mode: "fork",
        env: {\n`
    
    keyValues.forEach((key, i) => {
        template += `\t\t\t${key.name}: "${key.value}"`
        if (i < keyValues.length - 1) template += ',\n'
    })

    template += `\n\t\t},
        env_production: {\n`
            
        keyValues.forEach((key, i) => {
            template += `\t\t\t${key.name}: "${key.value}"`
            if (i < keyValues.length - 1) template += ',\n'
        })

    template += `\n\t\t}
    }]
}`

    return template
}

module.exports = content