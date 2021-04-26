function content() {
    const template = `const PG_HOST = process.env.PG_HOST
const PG_USERNAME = process.env.PG_USERNAME
const PG_PASSWORD = process.env.PG_PASSWORD
const PG_DATABASE = process.env.PG_DATABASE

module.exports = {
    PG_HOST,
    PG_USERNAME,
    PG_PASSWORD,
    PG_DATABASE
}
    `
    return template
}

module.exports = content