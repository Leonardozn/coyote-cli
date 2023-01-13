function content() {
    const template = `function health(req, res, next) {
\tres.status(200).send({data: 'Ok'})
}

module.exports = {
\thealth
}
    `
    return template
}

module.exports = content