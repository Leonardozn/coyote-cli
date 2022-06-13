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
    "dotenv": "^8.6.0",
    "express": "^4.18.1",
    "luxon": "^2.4.0",
    "mongoose": "^5.13.14",
    "morgan": "^1.10.0"
  }
}
    `

    return template
}

module.exports = content