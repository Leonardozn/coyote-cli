const objectid = require('objectid')
let objId_list = []

function buildValue(type, test, num, toCompare, expectValue, isEmail, saveId) {
  let str = ''
  const timeStr = expectValue ? 'T00:00:00.000Z' : ''

  if (type == 'String') {
    if (test == 'post') {
      if (isEmail) {
        str += `'supertestString@${toCompare ? 'added' : 'toAdd'}${num > -1 ? `${num}.com` : '.com'}'`
      } else {
        str += `'supertest string ${toCompare ? 'added' : 'to add'}${num > -1 ? ` ${num}` : ''}'`
      }
    }
    if (test == 'put') {
      if (isEmail) {
        str += `'supertestString@${toCompare ? 'updated' : 'toUpdate'}${num > -1 ? `${num}.com` : '.com'}'`
      } else {
        str += `'supertest string ${toCompare ? 'updated' : 'to update'}${num > -1 ? ` ${num}` : ''}'`
      }
    }
    if (test == 'delete') {
      if (isEmail) {
        str += `'supertestString@${toCompare ? 'removed' : 'toRemove'}${num > -1 ? `${num}.com` : '.com'}'`
      } else {
        str += `'supertest string ${toCompare ? 'removed' : 'to remove'}${num > -1 ? ` ${num}` : ''}'`
      }
    }
  }

  if (type == 'ObjectId') {
    if (toCompare && expectValue) {
      str += objId_list[0]
      objId_list.shift()
    } else {
      if (saveId) {
        str += `'${objectid()}'`
        objId_list.push(str)
      } else {
        str += `'${objectid()}'`
      }
    }
  }
  
  if (type == 'Number') str = num

  if (type == 'Boolean') {
    if (test == 'delete') {
      if (num == 7) {
        str = true
      } else {
        str = false
      }
    } else {
      str = true
    }
  }
  
  if (type == 'Date') {
    if (test == 'post') str = `'2022-12-30${timeStr}'`
    if (test == 'put') str = `'2022-12-31${timeStr}'`
    if (test == 'delete') {
      if (num == 7) {
        str = `'2023-01-01${timeStr}'`
      } else {
        str = `'2023-01-02${timeStr}'`
      }
    }
  }

  return str
}

function buildExpect(test, model, spaces, num, insideForLoop, arrayPosition) {
  let str = ''
  
  Object.keys(model.fields).forEach((field, i) => {
    if (!model.auth || (model.auth && field != 'password')) {
      const type = model.fields[field].type
      
      for (let i=0; i<spaces; i++) str += '\t'
      const inLoop = insideForLoop ? 'item' : 'response.body'
      const position = (typeof arrayPosition !== 'undefined' && typeof arrayPosition !== null) ? `[${arrayPosition}]` : ''
      const isEmail = model.fields[field].isEmail
      
      if (type == 'Array') {
        const contentType = model.fields[field].contentType
        
        str += `expect(${inLoop}${position}.${field}).toEqual(`

        if (contentType == 'Object') {
          const structure = { fields: model.fields[field].structure }

          str += `expect.arrayContaining([expect.objectContaining({\n`

          str += buildKeys(test, structure, spaces+1, num, true, false, true)
          str += '\n'
          
          for (let i=0; i<spaces; i++) str += '\t'

          str += '})]'
        } else {
          str += `[${buildValue(contentType, test, num, true, true, isEmail, false)}]`
        }

        if (contentType == 'Object') str += ')'
        str += ')'

      } else if (type == 'Object') {
        const structure = { fields: model.fields[field].structure }

        str += `expect(${inLoop}${position}.${field}).toEqual(expect.objectContaining({\n`
        str += buildKeys(test, structure, spaces+1, num, true, false, true)

        str += `\n`
        for (let i=0; i<spaces; i++) str += '\t'
        str += '}))'
      } else {
        str += `expect(${inLoop}${position}.${field})${type == 'String' ? '.toEqual' : '.toBe'}(${buildValue(type, test, num, true, true, isEmail, false)})`
      }
  
      if (i < Object.keys(model.fields).length - 1) str += '\n'
    }
  })

  return str
}

function buildKeys(test, model, spaces, num, toCompare, saveId, fromExpect) {
  let str = ''
  
  Object.keys(model.fields).forEach((field, i) => {
    const type = model.fields[field].type
    const isEmail = model.fields[field].isEmail

    for (let i=0; i<spaces; i++) str += '\t'

    if (type == 'Array') {
      const contentType = model.fields[field].contentType

      if (contentType == 'Object') {
        const structure = { fields: model.fields[field].structure }

        str += `${field}: [{\n`

        str += buildKeys(test, structure, spaces+1, num, toCompare, saveId, fromExpect)
        str += '\n'
        
        for (let i=0; i<spaces; i++) str += '\t'
        str += '}]'
      } else {
        fromExpect = fromExpect || false
        str += `${field}: [${buildValue(contentType, test, num, toCompare, fromExpect, isEmail, saveId)}]`
      }
    } else if (type == 'Object') {
      const structure = { fields: model.fields[field].structure }

      str += `${field}: {\n`
      str += buildKeys(test, structure, spaces+1, num, toCompare, saveId, fromExpect)

      str += `\n`
      for (let i=0; i<spaces; i++) str += '\t'
      str += '}'
    } else {
      fromExpect = fromExpect || false
      str += `${field}: ${buildValue(type, test, num, toCompare, fromExpect, isEmail, saveId)}`
    }

    if (i < Object.keys(model.fields).length - 1) str += ',\n'
  })

  return str
}

function content(modelName, models, auth) {
  const firstField = Object.keys(models[modelName].fields)[0]
  const type = models[modelName].fields[firstField].contentType || models[modelName].fields[firstField].type
  let save = type == 'ObjectId' ? true : false
  
  let template = `const app = require('../app')
const request = require('supertest')
const mongoose = require('mongoose')${auth ? `\nconst config = require('../src/config/app')` : ''}
const ${modelName.capitalize()} = require('../src/models/${modelName}')
  
describe('Testing ${modelName} controller', () => {
${auth ? '\tlet cookie': ''}
    
\t//STANDARD TEST\n`

if (models[modelName].auth) {
  template += `\tafterAll(async () => {
\t\tawait ${modelName.capitalize()}.remove({ email: 'supertestString@toAdd1.com' })

\t\tmongoose.disconnect()
\t})\n\n`
} else {
  template += `\tafterAll(async () =>mongoose.disconnect())\n\n`
}
  
  if (auth) {
    template += `\tdescribe('POST /auth/login', () => {
\t\ttest('Should response a 200 status code and a JSON content type.', async () => {
\t\t\tconst response = await request(app).post('/auth/login').send({ username: config.TEST_USERNAME, password: config.TEST_PASSWORD })
\t\t\tcookie = response.headers['set-cookie'].shift().split(';')[0]
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t})
\t})\n\n`
  }
  
  template += `\tdescribe('POST single (sending a object). E.g. -> /${modelName}/add', () => {
\t\tlet id

\t\tconst ${modelName} = {
${buildKeys('post', models[modelName], 3, 1, false, false)}
\t\t}

\t\tafterEach(async () => await ${modelName.capitalize()}.findByIdAndDelete(id))

\t\ttest(\`Should response a 201 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).post('/${modelName}/add')${auth ? `.set('Cookie', cookie)`: ''}.send(${modelName})
\t\t\tid = response.body._id
        
\t\t\texpect(response.statusCode).toBe(201)
\t\t\texpect(response.body).toBeInstanceOf(Object)
\t\t\texpect(response.body).not.toBeInstanceOf(Array)
\t\t\texpect(response.body._id).toBeDefined()
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t})
\t})
  
\tdescribe('POST many (sending an array of objects). E.g. -> /${modelName}/add', () => {
\t\tlet ids = []

\t\tlet ${modelName}_list = [
\t\t\t{
${buildKeys('post', models[modelName], 4, 2, false, false)}
\t\t\t},
\t\t\t{
${buildKeys('post', models[modelName], 4, 3, false, false)}
\t\t\t}
\t\t]

\t\tafterEach(async () => {
\t\t\t${modelName}_list.forEach(async (item, i) => await ${modelName.capitalize()}.findByIdAndDelete(ids[i]))
\t\t})

\t\ttest(\`Should response a 201 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).post('/${modelName}/add')${auth ? `.set('Cookie', cookie)`: ''}.send(${modelName}_list)
        
\t\t\texpect(response.statusCode).toBe(201)
\t\t\texpect(response.body).toBeInstanceOf(Array)
\t\t\texpect(response.body).not.toEqual({})
\t\t\tresponse.body.forEach(item => {
\t\t\t\texpect(item._id).toBeDefined()
\t\t\t\tids.push(item._id)
\t\t\t})
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t})
\t})
  
\tdescribe('GET /${modelName}/list', () => {
\t\tlet ${modelName}_list

\t\tbeforeEach(async () => {
\t\t\t${modelName}_list = await ${modelName.capitalize()}.insertMany([
\t\t\t\t{
${buildKeys('post', models[modelName], 5, 2, false, false)}
\t\t\t\t},
\t\t\t\t{
${buildKeys('post', models[modelName], 5, 3, false, false)}
\t\t\t\t}
\t\t\t])
\t\t})

\t\tafterEach(async () => {
\t\t\tfor (let item of ${modelName}_list) await ${modelName.capitalize()}.findByIdAndDelete(item._id)
\t\t})

\t\ttest(\`Should response a 200 status code and the response must be an array.\`, async () => {
\t\t\tconst response = await request(app).get('/${modelName}/list')${auth ? `.set('Cookie', cookie)`: ''}.send()
\t\t\tif(response.body.length) id = response.body[0]._id
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.body).toBeInstanceOf(Array)
\t\t\texpect(response.body).not.toEqual({})
\t\t\tresponse.body.forEach(item => {
\t\t\t\texpect(item._id).toBeDefined()
\t\t\t})
\t\t})
\t})
  
\tdescribe('GET /${modelName}/select/:id', () => {
\t\tlet ${modelName}

\t\tbeforeEach(async () => {
\t\t\t${modelName} = await ${modelName.capitalize()}.create({
${buildKeys('post', models[modelName], 4, 2, false, false)}
\t\t\t})
\t\t})
  
\t\tafterEach(async () => await ${modelName.capitalize()}.findByIdAndDelete(${modelName}._id))

\t\ttest(\`Should response a 200 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).get(\`/${modelName}/select/\${${modelName}._id}\`)${auth ? `.set('Cookie', cookie)`: ''}.send()
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.body).toBeInstanceOf(Object)
\t\t\texpect(response.body).not.toBeInstanceOf(Array)
\t\t\texpect(response.body._id).toBeDefined()
\t\t})
\t})
  
\tdescribe('PUT single (sending a id param). E.g. -> /${modelName}/update/1', () => {
\t\tlet ${modelName}
  
\t\tbeforeEach(async () => {
\t\t\t${modelName} = await ${modelName.capitalize()}.create({
${buildKeys('put', models[modelName], 4, 1, false, false)}
\t\t\t})
\t\t})
      
\t\tafterEach(async () => await ${modelName.capitalize()}.findByIdAndDelete(${modelName}._id))
      
\t\ttest(\`Should response a 200 status code and the response must be an object.\`, async () => {
\t\t\tconst response = await request(app).put(\`/${modelName}/update/\${${modelName}._id}\`)${auth ? `.set('Cookie', cookie)`: ''}.send({
${buildKeys('put', models[modelName], 4, -1, true, true)}
\t\t\t})
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.body).toBeInstanceOf(Object)
\t\t\texpect(response.body).not.toBeInstanceOf(Array)
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t\texpect(response.body._id).toBeDefined()
${buildExpect('put', models[modelName], 3, -1, false)}
\t\t})
\t})
  
\tdescribe('DELETE single (sending an id param). E.g. -> /${modelName}/remove/1', () => {
\t\tlet ${modelName}

\t\tbeforeEach(async () => {
\t\t\t${modelName} = await ${modelName.capitalize()}.create({
${buildKeys('delete', models[modelName], 5, 7, false, false)}
\t\t\t})
\t\t})
      
\t\tafterEach(async () => await ${modelName.capitalize()}.findByIdAndDelete(${modelName}._id))
  
\t\ttest(\`Should response a 200 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).delete(\`/${modelName}/remove/\${${modelName}._id}\`)${auth ? `.set('Cookie', cookie)`: ''}.send()
        
\t\t\texpect(response.statusCode).toBe(200)
\t\t\texpect(response.body).toBeInstanceOf(Object)
\t\t\texpect(response.body).not.toBeInstanceOf(Array)
\t\t\texpect(response.body.acknowledged).toBe(true)
\t\t\texpect(response.body.deletedCount).toBe(1)
\t\t})
\t})
})`

  return template
}

module.exports = content