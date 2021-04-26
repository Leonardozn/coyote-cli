function content() {
    const template = `PG_HOST=localhost
PG_USERNAME=postgres
PG_PASSWORD=postgres
PG_DATABASE=my_database
    `
    return template
}

module.exports = content