function content(auth) {

  let template = `const app = require('../app')
const request = require('supertest')
const mongoose = require('mongoose')${auth ? `\nconst config = require('../src/config/app')` : ''}
  
describe('Testing helth controller', () => {
${auth ? '\tlet cookie\n' : ''}
\tafterAll(() => mongoose.disconnect())\n\n`
  
  if (auth) {
    template += `\t\tdescribe('POST /auth/login', () => {
\t\t\ttest('Should response a 200 status code and a JSON content type.', async () => {
\t\t\t\tconst response = await request(app).post('/auth/login').send({ username: config.TEST_USERNAME, password: config.TEST_PASSWORD })
\t\t\t\tcookie = response.headers['set-cookie'].shift().split(';')[0]
        
\t\t\t\texpect(response.statusCode).toBe(200)
\t\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t\t})
\t\t})\n\n`
  }
  
  template += `\t\tdescribe('GET /health', () => {
\t\ttest(\`Should response a 200 status code and a data with a string 'Ok'.\`, async () => {
\t\t\tconst response = await request(app).get('/health')${auth ? `.set('Cookie', cookie)`: ''}.send()
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.body.data).toEqual('Ok')
\t\t})
\t})
})`

  return template
}

module.exports = content