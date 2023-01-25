function content(auth) {

  let template = `const app = require('../app')
const request = require('supertest')
const mongoose = require('mongoose')
const config = require('../src/config/app')\n`

  if (auth) {
    template += `const Role = require('../src/models/role')
const User = require('../src/models/user')\n`
  }
  
  template += `\ndescribe('Testing helth controller', () => {${auth ? '\n\tlet cookie\n\n' : '\n'}`

  if (auth) {
    template += `\tafterAll(async () => {
\t\tawait User.remove({ email: 'admin@testing.com' })
\t\tawait Role.remove({ name: 'test_master' })
\t\tmongoose.disconnect()
\t})\n\n`
  } else {
    template += `\tafterAll(() => mongoose.disconnect())\n\n`
  }
  
  if (auth) {
    template += `\tdescribe('POST /auth/login', () => {
\t\tbeforeEach(async () => {
\t\t\tconst role = await Role.create({ name: 'test_master', permissions: ['/'] })
\t\t\tawait User.create({
\t\t\t\tfirst_name: 'Test first name',
\t\t\t\tlast_name: 'Test last name',
\t\t\t\tusername: \`test_\${config.TEST_USERNAME}\`,
\t\t\t\temail: 'admin@testing.com',
\t\t\t\tpassword: config.TEST_PASSWORD,
\t\t\t\trole: role._id
\t\t\t})
\t\t})

\t\ttest('Should response a 200 status code and a JSON content type.', async () => {
\t\t\tconst response = await request(app).post(\`\${config.MAIN_PATH}/auth/login\`).send({ username: \`test_\${config.TEST_USERNAME}\`, password: config.TEST_PASSWORD })
\t\t\tcookie = response.headers['set-cookie'].shift().split(';')[0]
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t})
\t})\n\n`
  }
  
  template += `\tdescribe('GET /health', () => {
\t\ttest(\`Should response a 200 status code and a data with a string 'Ok'.\`, async () => {
\t\t\tconst response = await request(app).get(\`\${config.MAIN_PATH}/health\`)${auth ? `.set('Cookie', cookie)`: ''}.send()
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.body.data).toEqual('Ok')
\t\t})
\t})
})`

  return template
}

module.exports = content