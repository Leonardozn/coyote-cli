function content() {
    const template = `const healthCtrl = require('../controllers/health')

function healthRouter(router) {
\trouter.get('/health', healthCtrl.health)

\treturn router
}

module.exports = healthRouter`
    return template
}

module.exports = content