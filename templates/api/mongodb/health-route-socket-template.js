function content() {
    const template = `const healthCtrl = require('../controllers/health')

function healthRouter(socket) {
    socket.on('front:health', () => healthCtrl.health(socket))
}

module.exports = healthRouter`
    return template
}

module.exports = content