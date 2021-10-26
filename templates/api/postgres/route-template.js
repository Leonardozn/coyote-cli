function content(model, models) {
    let template = `const ${model}Ctrl = require('../controllers/${model}')

function ${model}Router(router) {
    router.post('/${model}/add', ${model}Ctrl.add) //add a record\n`

    if (!models[model].isManyToMany) template += `\trouter.get('/${model}/id/:id', ${model}Ctrl.selectById) //get a single record by id\n`
    
    template += `\trouter.get('/${model}/list', ${model}Ctrl.list) //get records by the specific fields
    router.put('/${model}/update', ${model}Ctrl.update) //update a record
    router.delete('/${model}/delete', ${model}Ctrl.remove) //delete a record
    router.get('/${model}/schema', ${model}Ctrl.options) //get schema description

    return router
}

module.exports = ${model}Router`

    return template
}

module.exports = content