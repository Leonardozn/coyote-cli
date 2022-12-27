function content(authType) {
    let template = `const authController = require('../controllers/auth')

function authRouter(router) {
    router.post('/auth/login', authController.login)`

    if (authType == 'cookies') {
        template += `\trouter.post('/auth/refresh', authController.refresh)
    router.post('/auth/signup', authController.signup)
    router.post('/auth/logout', authController.logout)`
    }

    template += `\n\n\treturn router
}

module.exports = authRouter`

    return template
}

module.exports = content