const utils = require('../../../controllers/utils')

function content(model, models) {
  let template = `<template>
    <div>
      <div class="text-center" v-if="!showTable">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
      <v-data-table
      dense
      :headers="headers"
      :items="desserts"
      :search="search"
      class="elevation-1"
      v-if="showTable"
      >
        <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title>${model.capitalize()} list</v-toolbar-title>
              <v-divider class="mx-4" inset vertical></v-divider>

              <v-spacer></v-spacer>

              <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
              ></v-text-field>

              <v-spacer></v-spacer>
              
              <v-btn v-if="allRequestChecked" color="primary" dark class="mb-2" @click="dialog=true">New ${model}</v-btn>
              <div class="text-center" v-if="!allRequestChecked">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </v-toolbar>
        </template>

        <template v-slot:item.actions="{ item }">
            <v-icon v-if="allRequestChecked" small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
        </template>
      </v-data-table>

      <!-- MAIN DIALOG -->
      <v-form ref="editedItem">
        <v-dialog v-model="dialog" max-width="800px" persistent>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ \`\${formTitle} ${model}\` }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>\n`

  let fieldList = models[model].fields
  if (models[model].foreignKeys) fieldList = fieldList.concat(models[model].foreignKeys)
  if (models[model].hasMany) fieldList.push(models[model].hasMany)

  fieldList.sort((a, b) => {
      const positionA = a.position || 0
      const positionB = b.position || 0

      if (positionA > positionB) {
          return 1
      } else if (positionA < positionB) {
          return -1
      }
  })

  fieldList.forEach((field, i) => {
    if (field.alias) {
      template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-autocomplete
                      v-model="editedItem.${field.name}.value"
                      :items="${field.model}"
                      :item-text="buildSelectComponentText"
                      item-value="id"
                      label="${field.label}"
                      clearable
                      dense
                    >
                    </v-autocomplete>
                  </v-col>`
    } else if (field.reference) {

    } else {
      if (field.interface.type == 'text') {
        template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-text-field dense v-model="editedItem.${field.name}" label="${field.label}"></v-text-field>
                  </v-col>`
      }
  
      if (field.interface.type == 'number') {
        template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-text-field dense v-model="editedItem.${field.name}" type="number" label="${field.label}"></v-text-field>
                  </v-col>`
      }
  
      if (field.interface.type == 'date') {
        template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-menu
                      v-model="menuPickers.${field.name}"
                      :close-on-content-click="false"
                      :nudge-right="40"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="editedItem.${field.name}"
                          label="${field.label}"
                          prepend-icon="mdi-calendar"
                          readonly
                          v-bind="attrs"
                          v-on="on"
                          dense
                          clearable
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="editedItem.${field.name}"
                        @input="menuPickers.${field.name} = false"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>`
      }
    }
    
    if (i < fieldList.length - 1) {
      template += '\n\n'
    } else {
      template += '\n'
    }
  })
  
  template += `\t\t\t\t\t\t\t\t</v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="save">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-form>

      <!-- DIALOG DELETE -->
      <v-dialog v-model="dialogDelete" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">Are you sure to delete this ${model}?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
            <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>

            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      search: "",
      showTable: false,
      headerId: null,
      headerSchema: null,
      headers: [\n`

  fieldList.forEach((field, i) => {
    if (field.reference) {
      const label = field.label || field.reference.capitalize()
      template += `\t\t\t\t{ text: '${label}', value: '${field.reference}' }`
    } else {
      const label = field.label || field.name.capitalize()
      template += `\t\t\t\t{ text: '${label}', value: '${field.name}' }`
    }

    if (i < fieldList.length - 1) {
      template += ',\n'
    } else {
      template += ',\n\t\t\t\t{ text: "Actions", value: "actions", sortable: false },\n'
    }
  })

  template += `\t\t\t],
      desserts: [],
      dialog: false,
      dialogDelete: false,
      editedIndex: -1,
      editedItem: {\n`

  fieldList.forEach((field, i) => {
    if (field.alias) {
      template += `\t\t\t\t${field.alias}: { relation: '${field.relation}', items: [], value: null }`
    } else if (field.reference) {
      template += `\t\t\t\t${field.reference}: { relation: 'Many-to-Many', items: [], value: null }`
    } else {
      if (field.interface.type == 'text') template += `\t\t\t\t${field.name}: ''`
      if (field.interface.type == 'number') template += `\t\t\t\t${field.name}: 0`
      if (field.interface.type == 'date') template += `\t\t\t\t${field.name}: ${field.interface.defaultValue ? 'new Date().toISOString().substr(0, 10)' : 'null'}` 
    }

    if (i < fieldList.length - 1) {
      template += ',\n'
    } else {
      template += '\n'
    }
  })

  template += `\t\t\t},
      deletedItem: {},
      defaultItem: {},\n`

  let existDate = false
  for (let field of fieldList) {
    if (field.interface && field.interface.type == 'date') {
      existDate = true
      break
    }
  }

  if (existDate) {
    template += `\t\t\tmenuPickers: {\n`

    fieldList.forEach((field, i) => {
      if (field.interface && field.interface.type == 'date') template += `\t\t\t\t${field.name}: false`

      if (i < fieldList.length - 1) {
        template += ',\n'
      } else {
        template += '\n'
      }
    })

    template += '\t\t\t},\n'
  }

  template += `\t\t\turlParams: '?updatedAt[order]=desc',
  },
  methods: {
    getData() {
      this.showTable = false

      this.$store.dispatch("getTitle")

      if (this.$store.state.${model}.schema) {
        this.buildDesserts()
      } else {
        const obj = {
          requestMethod: 'GET',
          model: '${model}',
          urlMethod: 'list',
          urlParams: this.urlParams,
          body: null
        }

        this.getNewData(obj)
      }
    },
    getNewData(obj) {
      this.showTable = false

      this.$store.dispatch('serverRequest', obj)
      .then(() => {
        if (this.dialog) this.close()
        this.buildDesserts()
      })
      .catch((err) => {
        alert(err.response.data.message)
        this.showTable = true
      })
    },
    buildDesserts() {
      const ${model}_list = this.$store.state.${model}
      this.desserts = []

      for (let item of ${model}_list.data) {
        this.desserts.push({
          id: item.id,\n`

  fieldList.forEach((field, i) => {
    if (field.alias) {
      let as = utils.aliasName(field.alias)
      let fieldRef = ''

      for (let item of models[field.name].fields) {
        if (item.name == 'name') {
          fieldRef = 'name'
          break
        } else {
          if (item.unique) {
            fieldRef = item.name
            break
          }
        }
      }

      if (!fieldRef) fieldRef = 'id'

      template += `\t\t\t\t\t${field.alias}: item.${as}.${fieldRef}`
    } else if (field.reference) {

    } else {
      if (field.interface.type == 'text') template += `\t\t\t\t\t${field.name}: item.${field.name}`
      if (field.interface.type == 'number') template += `\t\t\t\t\t${field.name}: this.convertToMoney(item.${field.name})`
      if (field.interface.type == 'date') {
        template += `\t\t\t\t\t${field.name}: item.${field.name} ? item.${field.name}.substr(0, 10) : null`
      }
    }

    if (i < fieldList.length - 1) {
      template += ',\n'
    } else {
      template += '\n'
    }
  })
        
  template += `\t\t\t\t})
      }

      this.headerSchema = ${model}_list.schema
      this.showTable = true
      
      this.defaultItem = Object.assign({}, this.editedItem)
    },
    valueFormat(value, field) {
      if (field != 'id') {
        if (this.headerSchema[field] && this.headerSchema[field].type == 'INTEGER') value = parseInt(value)
        if (this.headerSchema[field] && this.headerSchema[field].type == 'FLOAT') value = parseFloat(value.replace(',', ''))
      } else {
        value = parseInt(value)
      }

      return value
    },
    convertToMoney(x) {
    return x
      .toFixed(2)
      .toString()
      .replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")
    },\n`
  
  let selectFields = false
  for (let field of fieldList) {
    if (field.alias) {
      selectFields = true
      break
    }
  }

  if (selectFields) {
    template += `\t\tbuildSelectComponentText(item) {
      let val = ''\n\n`

    fieldList.forEach(field => {
      if (field.alias) {
        let fieldRef = ''
        for (let obj of models[field.name].fields) {
          if (obj.name == 'name') {
            fieldRef = 'name'
            break
          }

          if (obj.unique) fieldRef = obj.name
        }

        template += `\t\t\tif (item.model == '${field.name}') val = item.${fieldRef}\n`
      }
    })

    template += `\n\t\t\treturn val
    },\n`
  }

  template += `\t\tgetAutocompleteValue(relation, value, field, refField) {
      let response = null

      if (relation == 'One-to-One') {
        for (let obj of this.editedItem[field].items) {
          if (value == obj[refField]) {
            response = obj.id
            break
          }
        }
      }

      return response
    },
    clearSelects() {
      for (let field in this.defaultItem) {
        if (this.defaultItem[field] && this.defaultItem[field].value) this.defaultItem[field].value = null
        if (this.defaultItem[field] && this.defaultItem[field].values) this.defaultItem[field].values = []
      }
    },
    close() {
      this.dialog = false
      
      this.$nextTick(() => {
        this.clearSelects()
        this.headerId = null
        this.editedIndex = -1
        this.editedItem = Object.assign({}, this.defaultItem)
      })
    },
    closeDelete() {
      this.dialogDelete = false

      this.$nextTick(() => {
        this.clearSelects()
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      })
    },
    deleteItem(item) {
      this.editedIndex = this.desserts.indexOf(item)
      this.deletedItem = Object.assign({}, item)
      this.dialogDelete = true
    },
    deleteItemConfirm() {
      let body = { id: this.deletedItem.id }

      const obj = {
        requestMethod: 'DELETE',
        model: '${model}',
        urlMethod: 'delete',
        urlParams: this.urlParams,
        body: body
      }

      this.getNewData(obj)
      this.closeDelete()
    },
    save() {
      let body = {}
      
      for (let field in this.editedItem) {
        if (this.editedItem[field] && this.editedItem[field].relation && this.editedItem[field].relation == 'One-to-One') {
          body[field] = this.editedItem[field].value
        } else {
          body[field] = this.editedItem[field]
        }
      }

      const obj = {
        requestMethod: '',
        model: '${model}',
        urlMethod: '',
        urlParams: this.urlParams,
        body: body
      }
      
      if (this.editedIndex > -1) {
        body.id = this.headerId
        obj.requestMethod = 'PUT'
        obj.urlMethod = 'update'

        this.getNewData(obj)
      } else {
        obj.requestMethod = 'POST'
        obj.urlMethod = 'add'

        this.getNewData(obj)
      }
    },
    editItem(item) {
      this.editedIndex = this.desserts.indexOf(item)
      this.editedItem = Object.assign({}, this.defaultItem)\n`

  if (selectFields) {
    template += `\t\t\tconst relationFields = [`
    fieldList.forEach((field, i) => {
      if (i > 0) {
        template += ` ,'${field.alias}'`
      } else {
        template += `'${field.alias}'`
      }
    })
  
    template += `]\n`
  }

      
  template += `\n\t\t\tfor (let field in this.editedItem) {\n`
  
  if (selectFields) {
    template += `\t\t\t\tif (item[field]) {
          if (relationFields.indexOf(field) > -1) {\n`

    fieldList.forEach(field => {
      if (field.alias) {
        let fieldRef = ''
        for (let obj of models[field.name].fields) {
          if (obj.name == 'name') {
            fieldRef = 'name'
            break
          }

          if (obj.unique) fieldRef = obj.name
        }

        template += `\t\t\t\t\t\tif (field == '${field.alias}') this.editedItem[field].value = this.getAutocompleteValue('${field.relation}', item[field], field, '${fieldRef}')\n`
      }
    })
    
    template += `\t\t\t\t\t}
        } else {
          this.editedItem[field] = this.valueFormat(item[field], field)
        }\n`
  } else {
    template += `\t\t\t\tif (item[field]) {
          this.editedItem[field] = this.valueFormat(item[field], field)
        }\n`
  }
        
  template += `\t\t\t}
      
      this.headerId = item.id
      
      this.dialog = true
    }
  },
  computed: {\n`

  if (selectFields) {
    for (let field of fieldList) {
      if (field.alias) {
        template += `\t\t${field.name}() {
      if (this.$store.state.${field.name}.data.length > 0) {
        for (let item of this.$store.state.${field.name}.data) {
          this.editedItem.${field.alias}.items.push({ model: '${field.name}', ...item })
        }
      }

      return this.editedItem.${field.alias}.items
    },\n`
      }
    }
  }
    
  template += `\t\tformTitle() {
      if (this.editedIndex === -1) {
        return 'New';
      } else {
        return 'Edit';
      }
    },\n`

  if (selectFields) {
    template += `\t\tallRequestChecked() {
      let show = true\n\n`

    for (let field of fieldList) {
      if (field.alias) template += `\t\t\tif (!this.editedItem.${field.alias}.items.length) show = false\n`
    }
      
    template += `\n\t\t\treturn show
    }
  },\n`
  }
    
  template += `\t\tbeforeMount() {
    this.getData()
  }
}
</script>`

  return template
}

module.exports = content