function content() {
    let template = `String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}`

    return template
}

module.exports = content