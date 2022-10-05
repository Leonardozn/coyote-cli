function content(keyValues) {
    let template = ''

    keyValues.forEach(el => {
        template += `${el.name}=\n`
    })

    return template
}

module.exports = content