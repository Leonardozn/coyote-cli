function content(settings) {
    const projectName = settings.name
    const keyValues = settings.environmentKeyValues

    let template = `module.exports = {
\tapps : [{
\t\tname   : "${projectName}",
\t\tscript : "./index.js",
\t\twatch: true,
\t\tinstances: 1,
\t\tmax_memory_restart: "1G",
\t\texec_mode: "fork",
\t\tenv: {\n`
    
    keyValues.forEach((key, i) => {
        template += `\t\t\t${key.name}: "${key.value}"`
        if (i < keyValues.length - 1) template += ',\n'
    })

    template += `\n\t\t},
\t\tenv_production: {\n`
            
        keyValues.forEach((key, i) => {
            template += `\t\t\t${key.name}: "${key.value}"`
            if (i < keyValues.length - 1) template += ',\n'
        })

    template += `\n\t\t}
\t}]
}`

    return template
}

module.exports = content