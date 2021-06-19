function content(models) {
    const modelNames = Object.keys(models)

    let template = `const express = require('express')
let router = express.Router()
const healthRouter = require('./health')\n`

    modelNames.forEach(model => {
        template += `const ${model}Router = require('./${model}')\n`
    })

    template += `\nfunction getRouter() {
    healthRouter(router)\n`

    modelNames.forEach(model => {
        template += `    ${model}Router(router)\n`
    })
    
    template += `\n    return router
}

module.exports = getRouter`

    return template
}

module.exports = content