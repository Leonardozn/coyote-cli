function content(models) {
    let template = ''
    const modelNames = Object.keys(models)

    modelNames.forEach(model => {
        template += `const ${model}_fields = [\n`

        models[model].fields.forEach((field, i) => {
            if (i == models[model].fields.length - 1) {
                template += `    '${field.name}'\n`
            } else {
                template += `    '${field.name}',\n`
            }
        })

        template += `]\n\n`
    })

    template += `module.exports = {\n`

    modelNames.forEach((model, i) => {
        if (i == modelNames.length - 1) {
            template += `    ${model}_fields\n`
        } else {
            template += `    ${model}_fields,\n`
        }
    })

    template += '}'

    return template
}

module.exports = content