function content() {
    const template = `const app = require('./app')
const port = 8300

app.listen(port, () => {
    console.log(\`Run in port \${port}\`)
})
    `

    return template
}


module.exports = content