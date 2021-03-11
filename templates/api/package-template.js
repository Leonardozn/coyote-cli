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
    "body-parser": "1.19.0",
    "cors": "2.8.5",
    "dotenv": "8.2.0",
    "express": "4.17.1",
    "mongoose": "5.10.15",
    "morgan": "1.10.0",
    "jsonwebtoken": "^8.5.1"
  }
}
    `

    return template
}

module.exports = content