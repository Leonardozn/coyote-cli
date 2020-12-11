function content() {
    const template = `require('dotenv').config()

const MONGO_HOST = process.env.MONGO_HOST
const MONGO_PORT = process.env.MONGO_PORT
const MONGO_DATABASE = process.env.MONGO_DATABASE

module.exports = {
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DATABASE
}
    `
    return template
}

module.exports = content