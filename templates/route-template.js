function content(model) {
    const template = `const ${model}Ctrl = require('../controllers/${model}')

function ${model}Router(router) {
    router.post('/${model}/add', ${model}Ctrl.add) //add a record
    router.get('/${model}/all', ${model}Ctrl.all) //get all records
    router.get('/${model}/list', ${model}Ctrl.list) //get all active records
    router.get('/${model}/id/:id', ${model}Ctrl.selectById) //get a single record by id
    router.get('/${model}/select', ${model}Ctrl.selectByQuery) //get records by the specific fields
    router.put('/${model}/update', ${model}Ctrl.update) //update a record

    return router
}

module.exports = ${model}Router
    `

    return template
}

module.exports = content