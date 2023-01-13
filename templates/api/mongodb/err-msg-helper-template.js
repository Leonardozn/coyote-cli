function content() {
    let template = `function buildError(error) {
\tlet obj = {
\t\tstatus: error.status || 500,
\t\tmessage: error.message || 'Internal service error, please contact the administrator.',
\t\titem: error.item || null
\t}
    
\t// Unique constraint
\tif (error.code && error.code == 11000) {
\t\tconst field = Object.keys(error.keyValue)[0]
        
\t\tobj.status = 400
\t\tobj.message = \`Unique field: The value of "\${field}" field already exist.\`
\t\tobj.item = error.keyValue
\t}

\treturn obj
}

module.exports = {
\tbuildError
}`

    return template
}

module.exports = content