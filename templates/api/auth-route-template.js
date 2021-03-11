function content() {
    const template = `const authController = require('../controllers/auth')

function authRouter(router) {
    router.post('/auth/login', authController.login)
    router.post('/auth/refresh', authController.refresh)
    router.get('/auth/authenticated', authController.authenticated)

    return router
}

module.exports = authRouter`

    return template
}

module.exports = content