function content(model) {
    const template = `const ${model}Ctrl = require('../controllers/${model}')

function ${model}Router(router) {
    router.post('/${model}/add', ${model}Ctrl.add)
    router.get('/${model}/all', ${model}Ctrl.all)
    router.get('/${model}/list', ${model}Ctrl.list)
    router.get('/${model}/id/:id', ${model}Ctrl.selectById)
    router.get('/${model}/select', ${model}Ctrl.selectByQuery)
    router.put('/${model}/update', ${model}Ctrl.update)

    return router
}

module.exports = ${model}Router
    `

    return template
}

module.exports = content