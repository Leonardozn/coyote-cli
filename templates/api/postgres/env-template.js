function content(keyValues) {
    let template = ''

    keyValues.forEach(el => {
        template += `${el.name}=${el.value}\n`
    })

    return template
}

module.exports = content