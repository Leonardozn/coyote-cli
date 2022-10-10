function content(models) {
    const modelNames = Object.keys(models)

    let template = `const healthRouter = require('./health')\n`

    modelNames.forEach(model => {
        template += `const ${model}Router = require('./${model}')\n`
    })

    template += `\nfunction getRouter(io, socket) {
healthRouter(socket)\n`

    modelNames.forEach(model => {
        template += `\t${model}Router(io, socket)\n`
    })
    
    template += `
}

module.exports = getRouter`

    return template
}

module.exports = content