const objectid = require('objectid')
const qs = require('json-qs-converter')
let objId_list = []

function getQuery(model, test, num, toCompare, getObjId) {
  const fields = Object.keys(model.fields)
  let obj = {}
  let exist = false

  for (let field of fields) {
    const type = model.fields[field].type

    if (type == 'String' || type == 'ObjectId') {
      exist = true
      let value

      if (type == 'ObjectId' && getObjId) {
        value = objId_list[0].split('')
        objId_list = []
      } else {
        value = buildValue(type, test, num, toCompare, false).split('')
      }

      value.shift()
      value.pop()
      obj[field] = value.join('')

      break
    }
  }

  if (!exist) {
    for (let field of fields) {
      const type = model.fields[field].type

      if (type == 'Number') {
        exist = true
        obj[field] = buildValue(type, test, num, toCompare, false)
  
        break
      }
    }
  }

  if (!exist) {
    for (let field of fields) {
      if (model.fields[field].type == 'Object') {
        exist = true
        const structure = { fields: model.fields[field].structure }
        obj[field] = getQuery(structure, test, num, toCompare, getObjId)

        break
      }
    }
  }

  if (!exist) {
    for (let field of fields) {
      if (model.fields[field].type == 'Array') {
        exist = true
        const contentType = model.fields[field].contentType

        if (contentType == 'Object') {
          const structure = { fields: model.fields[field].structure }
          obj[field] = [getQuery(structure, test, num, toCompare, getObjId)]
        } else {
          let value

          if (contentType == 'String' || contentType == 'ObjectId' || contentType == 'Date') {
            if (contentType == 'ObjectId' && getObjId) {
              value = objId_list[0].split('')
              objId_list = []
            } else {
              value = buildValue(contentType, test, num, toCompare, false).split('')
            }
            
            value.shift()
            value.pop()
            obj[field] = [value.join('')]
          } else {
            obj[field] = [buildValue(contentType, test, num, toCompare, false)]
          }
        }

        break
      }
    }
  }

  if (!exist) {
    for (let field of fields) {
      const type = model.fields[field].type

      if (type == 'Date') {
        exist = true
        let value = buildValue(type, test, num, toCompare, false).split('')

        value.shift()
        value.pop()
        obj[field] = value.join('')
  
        break
      }
    }
  }

  if (!exist) {
    for (let field of fields) {
      const type = model.fields[field].type

      if (type == 'Boolean') {
        exist = true
        obj[field] = buildValue(type, test, num, toCompare, false)
  
        break
      }
    }
  }
  
  return obj
}

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
const mongoQuery = require('../src/controllers/mongo-query')
const ${modelName.capitalize()} = require('../src/models/${modelName}')
const ${modelName.capitalize()}Ctrl = require('../src/controllers/${modelName}')
  
describe('Testing ${modelName} controller', () => {
\tlet ${auth ? 'cookie, ': ''}id
  
\tconst new${modelName.capitalize()} = {
${buildKeys('post', models[modelName], 2, 1, false, false)}
\t}
  
\tlet ${modelName}_list = [
\t\t{
${buildKeys('post', models[modelName], 3, 2, false, false)}
\t\t},
\t\t{
${buildKeys('post', models[modelName], 3, 3, false, false)}
\t\t}
\t]
    
\t//STANDARD TEST
\tafterAll(async () => {\n`

  if (models[modelName].auth) {
    template += `\t\tawait ${modelName.capitalize()}.remove({ email: 'supertestString@toAdd1.com' })
    
\t\tfor (let item of ${modelName}_list) await ${modelName.capitalize()}.deleteMany(item)\n`
  } else {
    template += `\t\tawait ${modelName.capitalize()}.deleteMany(mongoQuery.buildJsonQuery(new${modelName.capitalize()}, 'aggregate', ${modelName.capitalize()}Ctrl.schema())[0])
    
\t\tfor (let item of ${modelName}_list) await ${modelName.capitalize()}.deleteMany(mongoQuery.buildJsonQuery(item, 'aggregate', ${modelName.capitalize()}Ctrl.schema())[0])\n`
  }

  template +=`\n\t\tmongoose.disconnect()
\t})\n\n`
  
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
\t\ttest(\`Should response a 201 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).post('/${modelName}/add')${auth ? `.set('Cookie', cookie)`: ''}.send(new${modelName.capitalize()})
        
\t\t\texpect(response.statusCode).toBe(201)
\t\t\texpect(response.body).toBeInstanceOf(Object)
\t\t\texpect(response.body).not.toBeInstanceOf(Array)
\t\t\texpect(response.body._id).toBeDefined()
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t})
\t})
  
\tdescribe('POST many (sending an array of objects). E.g. -> /${modelName}/add', () => {
\t\ttest(\`Should response a 201 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).post('/${modelName}/add')${auth ? `.set('Cookie', cookie)`: ''}.send(${modelName}_list)
        
\t\t\texpect(response.statusCode).toBe(201)
\t\t\texpect(response.body).toBeInstanceOf(Array)
\t\t\texpect(response.body).not.toEqual({})
\t\t\tresponse.body.forEach(item => expect(item._id).toBeDefined())
\t\t\texpect(response.headers['content-type']).toContain('json')
\t\t})
\t})
  
\tdescribe('GET /${modelName}/list', () => {
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
\t\ttest(\`Should response a 200 status code and the response must be a object.\`, async () => {
\t\t\tconst response = await request(app).get(\`/${modelName}/select/\${id}\`)${auth ? `.set('Cookie', cookie)`: ''}.send()
        
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