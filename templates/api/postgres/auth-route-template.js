function content() {
    const template = `const authController = require('../controllers/auth')

function authRouter(router) {
    router.post('/auth/login', authController.login)
    router.post('/auth/refresh', authController.refresh)
    router.post('/auth/reset-password', authController.resetPassword)
    router.post('/auth/reset-password/:userId/:token', authController.confirmResetPassword)

    return router
}

module.exports = authRouter`

    return template
}

module.exports = content