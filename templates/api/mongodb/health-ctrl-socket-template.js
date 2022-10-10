function content() {
    const template = `function health(socket) {
    socket.emit('back:health', 'ok')
}

module.exports = {
    health
}`
    return template
}

module.exports = content