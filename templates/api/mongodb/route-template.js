function content(model) {
    const template = `const ${model}Ctrl = require('../controllers/${model}')
const validationSchema = require('../middlewares/${model}')

function ${model}Router(router) {
\trouter.post('/${model}/add', validationSchema, ${model}Ctrl.add)
\trouter.get('/${model}/select/:id', ${model}Ctrl.selectById)
\trouter.get('/${model}/list', ${model}Ctrl.list)
\trouter.put('/${model}/update', validationSchema, ${model}Ctrl.update)
\trouter.delete('/${model}/remove', ${model}Ctrl.remove)
\trouter.get('/${model}/schema', ${model}Ctrl.getSchema)

\treturn router
}

module.exports = ${model}Router`

    return template
}

module.exports = content