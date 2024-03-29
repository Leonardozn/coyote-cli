function content(keyValues) {
    let template = ''

    keyValues.forEach(el => {
        template += `const ${el.name} = process.env.${el.name}\n`
    })

    template += '\nmodule.exports = {\n'

    keyValues.forEach((el, i) => {
        if (i == keyValues.length - 1) {
            template += `\t${el.name}\n`
        } else {
            template += `\t${el.name},\n`
        }
    })

    template += '}'
    
    return template
}

module.exports = content