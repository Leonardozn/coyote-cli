function content(models) {
    let template = ''
    let modelNames = Object.keys(models)
    let list = [...modelNames]

    list.forEach((el, i) => {
        if (el == 'auth') modelNames.splice(i, 1)
    })

    modelNames.forEach(model => {
        template += `const ${model}_fields = [
    '_id',\n`

        Object.keys(models[model].fields).forEach((field, i) => {
            if (!models[model].fields[field].hidden) {
                if (i == models[model].fields.length - 1) {
                    template += `\t'${field}'`
                } else {
                    template += `\t'${field}',\n`
                }
            }
        })

        template += `]\n\n`

    })

    template += `module.exports = {\n`

    modelNames.forEach((model, i) => {
        if (i == modelNames.length - 1) {
            template += `\t${model}_fields\n`
        } else {
            template += `\t${model}_fields,\n`
        }
    })

    template += '}'

    return template
}

module.exports = content