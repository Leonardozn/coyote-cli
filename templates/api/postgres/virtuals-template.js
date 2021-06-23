function content(models) {
    let template = ''
    let modelNames = Object.keys(models)
    let list = [...modelNames]

    list.forEach((el, i) => {
        if (el == 'auth') modelNames.splice(i, 1)
    })

    modelNames.forEach(model => {
        template += `const ${model}_fields = [
    'id',\n`

        models[model].fields.forEach((field, i) => {
            if (field.name.indexOf('password') == -1) {
                if (i == models[model].fields.length - 1) {
                    template += `    '${field.name}'\n`
                } else {
                    template += `    '${field.name}',\n`
                }
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