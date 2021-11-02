function content(projectName) {
    const template = `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node ."
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "pg": "^8.5.1",
    "pg-hstore": "^2.3.3",
    "sequelize": "^6.6.2",
    "morgan": "^1.10.0",
    "jsonwebtoken": "^8.5.1"
  }
}
    `

    return template
}

module.exports = content