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
    "express-validator": "^6.14.2",
    "luxon": "^2.4.0",
    "mongoose": "^5.13.14",
    "socket.io": "^4.5.2"
  }
}
    `

    return template
}

module.exports = content