function content(models) {
    let template = ''
    let modelNames = Object.keys(models)
    let list = [...modelNames]

    list.forEach((el, i) => {
        if (el == 'auth') modelNames.splice(i, 1)
    })

    modelNames.forEach(model => {
        if (models[model].isManyToMany) {
            template += `const ${model}_fields = [\n`
        } else {
            template += `const ${model}_fields = [
    'id'`
        }

        if (models[model].fields.length) {
            template += ',\n'

            models[model].fields.forEach((field, i) => {
                if (!models[model].encryptFields || models[model].encryptFields.indexOf(field.name) == -1) {
                    if (i == models[model].fields.length - 1) {
                        template += `\t'${field.name}'`
                    } else {
                        template += `\t'${field.name}',\n`
                    }
                }
            })
        }

        if (models[model].foreignKeys) {
            if (template[template.length-2] != ',') template += ',\n'

            models[model].foreignKeys.forEach((field, i) => {
                if (i == models[model].foreignKeys.length - 1) {
                    template += `\t'${field.alias}'\n`
                } else {
                    template += `\t'${field.alias}',\n`
                }
            })
        } else {
            template += '\n'
        }

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