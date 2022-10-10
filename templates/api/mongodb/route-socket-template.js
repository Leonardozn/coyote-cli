function content(model) {
    const template = `const ${model}Ctrl = require('../controllers/${model}')
const validationSchema = require('../middlewares/${model}')

function ${model}Router(io, socket) {
    socket.on('front:${model}:add', body => ${model}Ctrl.add(io, body))
    socket.on('front:${model}:select', id => ${model}Ctrl.selectById(socket, id))
    socket.on('front:${model}:list', body => ${model}Ctrl.list(socket, body))
    socket.on('front:${model}:update', body => ${model}Ctrl.update(io, body))
    socket.on('front:${model}:remove', body => ${model}Ctrl.remove(io, body))
    socket.on('front:${model}:schema', () => ${model}Ctrl.getSchema(io))
}

module.exports = ${model}Router
    `

    return template
}

module.exports = content