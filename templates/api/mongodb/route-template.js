function content(model) {
    const template = `const ${model}Ctrl = require('../controllers/${model}')
const validationSchema = require('../middlewares/${model}')

function ${model}Router(router) {
    router.post('/${model}/add', validationSchema, ${model}Ctrl.add)
    router.get('/${model}/select/:id', ${model}Ctrl.selectById)
    router.get('/${model}/list', ${model}Ctrl.list)
    router.put('/${model}/update', validationSchema, ${model}Ctrl.update)
    router.delete('/${model}/remove', ${model}Ctrl.remove)
    router.get('/${model}/schema', ${model}Ctrl.getSchema)

    return router
}

module.exports = ${model}Router
    `

    return template
}

module.exports = content