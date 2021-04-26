function content() {
    const template = `const healthCtrl = require('../controllers/health')

function healthRouter(router) {
    router.get('/health', healthCtrl.health)

    return router
}

module.exports = healthRouter
    `
    return template
}

module.exports = content