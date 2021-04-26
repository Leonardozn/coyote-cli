function content() {
    const template = `MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DATABASE=my_database
    `
    return template
}

module.exports = content