function content() {
    const template = `const { Sequelize } = require('sequelize')
const config = require('../config/app')

const sequelize = new Sequelize(config.PG_DATABASE, config.PG_USERNAME, config.PG_PASSWORD, {
    host: config.PG_HOST,
    dialect: 'postgres'
})

sequelize.sync()

module.exports = sequelize
    `

    return template
}

module.exports = content