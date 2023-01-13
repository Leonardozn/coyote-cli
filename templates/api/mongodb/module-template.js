function content() {
    const template = `const mongoose = require('mongoose')
const config = require('../config/app')
const credentials = \`mongodb://\${config.MONGO_HOST}:\${config.MONGO_PORT}/\${config.MONGO_DATABASE}\`
const options = {useNewUrlParser: true, useUnifiedTopology: true}

mongoose.set('strictQuery', true)

mongoose.connect(credentials, options, (err) => {
\tif (err) {
\t\treturn console.log(\`\\x1b[31m Mongodb connection \${err}\`)
\t} else {
\t\treturn console.log(\`\\x1b[32m Mongodb connection successfully\`)
\t}
})

module.exports = mongoose`

    return template
}

module.exports = content