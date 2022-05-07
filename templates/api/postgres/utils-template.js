function content(auth) {
    let template = ''

    if (auth) {
        template += `const bcrypt = require('bcrypt')

function encryptPwd(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return reject({status: 500, message: err.message})
            return resolve(hash)
        })
    })
}

function verifyPwd(password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            if (err) return reject({status: 500, message: err.message})
            return resolve(result)
        })
    })
}\n\n`
    }

    template += `function errorMessage(err) {
    let error = {
        status: err.status || 500,
        message: err.message || 'Internal service error, please contact the administrator.'
    }
    
    return error
}

function apiError(status, message) {
    this.name = 'Api error'
    this.status = status
    this.message = message
}

apiError.prototype = Error.prototype

function getLocalDate() {
    const date = new Date()
    const localDate = \`\${date.getFullYear()}-\${date.getMonth()+1}-\${date.getDate()} \${date.getHours()}:\${date.getMinutes()}:\${date.getSeconds()} UTC\`
    
    return new Date(localDate)
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}\n\n`

    if (auth) {
        template += `function historyStructure(req, response, bulk, action) {
    if (bulk) {
        if (action == 'CREATED') {
            let records = []
            for (let item of response) {
                let obj = {}
                for (let field in item.dataValues) {
                    if (field != 'createdAtd' && field != 'updatedAt') {
                        if (field == 'id') {
                            obj.identifier = item.id
                        } else {
                            obj[field] = item[field]
                        }
                    }
                }

                obj.user = req.user.id
                obj.action = action
                records.push(obj)
            }

            return records
        }
    } else {
        if (action == 'CREATED') {
            let record = {}
            for (let field in response.dataValues) {
                if (field != 'createdAtd' && field != 'updatedAt') {
                    if (field == 'id') {
                        record.identifier = response.id
                    } else {
                        record[field] = response[field]
                    }
                }
            }

            record.user = req.user.id
            record.action = action
            return record
        }
    }
}\n\n`
    }

    template += `module.exports = {\n`

    if (auth) {
        template += `\tencryptPwd,
    verifyPwd,
    historyStructure,\n`
    }

    template += `\terrorMessage,
    apiError,
    getLocalDate
}`

    return template
}

module.exports = content