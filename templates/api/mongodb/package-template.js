function content(projectName) {
    const template = `{
\t"name": "${projectName}",
\t"version": "1.0.0",
\t"description": "",
\t"main": "index.js",
\t"scripts": {
\t\t"start": "node ."
\t},
\t"keywords": [],
\t"author": "",
\t"license": "ISC",
\t"dependencies": {}
}`

    return template
}

module.exports = content