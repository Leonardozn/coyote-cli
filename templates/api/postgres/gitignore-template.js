function content(auth) {
    let template = `node_modules
.env
settings.json`

    if (auth) template += '\n.queries.txt'

    return template
}

module.exports = content