function content(authType) {
    let template = `const authController = require('../controllers/auth')

function authRouter(router) {
\trouter.post('/auth/login', authController.login)`

    if (authType == 'cookies') {
        template += `\n\trouter.post('/auth/refresh', authController.refresh)
\trouter.post('/auth/signup', authController.signup)
\trouter.post('/auth/logout', authController.logout)`
    }

    template += `\n\n\treturn router
}

module.exports = authRouter`

    return template
}

module.exports = content