const utils = require('../../../controllers/utils')

function content(headerModel, detailModel, models) {
    let template = `<template>
    <div>
      <div class="text-center" v-if="!showTable">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
        <v-data-table
        :headers="headers"
        :items="desserts"
        :search="search"
        class="elevation-1"
        :single-select="false"
        show-select
        v-model="selected"
        v-if="showTable"
        dense
      >
        <template v-slot:top>
            <v-row class="d-flex align-center justify-center">
              <v-col cols="12" md="3">
                <v-toolbar-title>${headerModel} list</v-toolbar-title>
              </v-col>

              <v-col cols="12" md="5">
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="4">
                <v-btn v-if="allRequestChecked" color="primary" small dark @click="dialog=true">New ${headerModel}</v-btn>
                <div class="text-center" v-if="!allRequestChecked">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
              </v-col>
            </v-row>

          <div class="ml-2">
            <v-row class="d-flex justify-start align-center">
              <v-col sm="6" md="4">
                <v-autocomplete
                  v-model="manyRowsAction.value"
                  :items="manyRowsAction.items"
                  label="Seleccione la acción"
                  clearable
                  dense
                >
                </v-autocomplete>
              </v-col>

              <v-col sm="6" md="4">
                <v-btn small color="primary" dark class="mb-2" @click="getSelected">Send</v-btn>
              </v-col>
            </v-row>
          </div>
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
              <span class="text-h5">{{ \`\${formTitle} ${headerModel}\` }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>\n`
  let fieldList = models[headerModel].fields
  if (models[headerModel].foreignKeys) fieldList = fieldList.concat(models[headerModel].foreignKeys)
  if (models[headerModel].hasMany) fieldList.push(models[headerModel].hasMany)

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

                <v-btn :disabled="headerButton" color="primary" dark class="mb-2" @click="saveHeader">Save ${headerModel}</v-btn>

                <v-divider class="mx-4" inset vertical></v-divider>

                <v-btn :disabled="detailButton" color="primary" dark class="mb-2" @click="detailDialog=true">Add ${detailModel}</v-btn>

                <!-- DETAIL DATA TABLE -->
                <v-row>
                  <v-data-table
                  :headers="detailHeaders"
                  :items="detailDesserts"
                  :search="search"
                  class="elevation-1"
                  dense
                  >
                    <template v-slot:item.actions="{ item }">
                        <v-icon small class="mr-2" @click="editDetail(item)">mdi-pencil</v-icon>
                        <v-icon small @click="deleteDetail(item)">mdi-delete</v-icon>
                    </template>
                  </v-data-table>
                </v-row>
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

      <!--DETAIL DIALOG -->
      <v-form ref="editedDetail">
        <v-dialog v-model="detailDialog" max-width="800px" persistent>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ \`\${formTitle} ${detailModel}\` }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>\n`
  let detailFieldList = models[detailModel].fields
  if (models[detailModel].foreignKeys) detailFieldList = detailFieldList.concat(models[detailModel].foreignKeys)
  if (models[detailModel].hasMany) detailFieldList.push(models[detailModel].hasMany)

  detailFieldList.sort((a, b) => {
      const positionA = a.position || 0
      const positionB = b.position || 0

      if (positionA > positionB) {
          return 1
      } else if (positionA < positionB) {
          return -1
      }
  })

  detailFieldList.forEach((field, i) => {
    if (field.alias) {
      template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-autocomplete
                      v-model="editedDetail.${field.name}.value"
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
                    <v-text-field dense v-model="editedDetail.${field.name}" label="${field.label}"></v-text-field>
                  </v-col>`
      }
  
      if (field.interface.type == 'number') {
        template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-text-field dense v-model="editedDetail.${field.name}" type="number" label="${field.label}"></v-text-field>
                  </v-col>`
      }
  
      if (field.interface.type == 'date') {
        template += `\t\t\t\t\t\t\t\t\t<v-col cols="12" sm="6" md="4">
                    <v-menu
                      v-model="detailMenuPickers.${field.name}"
                      :close-on-content-click="false"
                      :nudge-right="40"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="editedDetail.${field.name}"
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
                        v-model="editedDetail.${field.name}"
                        @input="detailMenuPickers.${field.name} = false"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>`
      }
    }
    
    if (i < detailFieldList.length - 1) {
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
              <v-btn color="blue darken-1" text @click="closeDetail">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="saveDetail">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-form>

      <!-- DIALOG DELETE -->
      <v-dialog v-model="dialogDelete" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">Are you sure to delete this ${headerModel}?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
            <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>

            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DETAIL DIALOG DELETE -->
      <v-dialog v-model="detailDialogDelete" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">Are you sure to delete this ${detailModel}?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="blue darken-1" text @click="closeDetailDelete">Cancel</v-btn>
            <v-btn color="blue darken-1" text @click="deleteDetailConfirm">OK</v-btn>

            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DELETE MANY DIALOG -->
      <v-dialog v-model="deleteManyDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">Are you sure to delete these ${headerModel}?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="blue darken-1" text @click="closeDeleteMany">Cancel</v-btn>
            <v-btn color="blue darken-1" text @click="deleteManyConfirm">OK</v-btn>

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

  template += `\t\t\turlHeaderParams: '?updatedAt[order]=desc',
      headerButton: false, // DETAIL DATA
      detailSchema: null,
      detailButton: true,
      detailHeaders: [\n`

  detailFieldList.forEach((field, i) => {
    if (field.reference) {
      const label = field.label || field.reference.capitalize()
      template += `\t\t\t\t{ text: '${label}', value: '${field.reference}' }`
    } else {
      const label = field.label || field.name.capitalize()
      template += `\t\t\t\t{ text: '${label}', value: '${field.name}' }`
    }

    if (i < detailFieldList.length - 1) {
      template += ',\n'
    } else {
      template += ',\n\t\t\t\t{ text: "Actions", value: "actions", sortable: false },\n'
    }
  })

  template += `\t\t\t],
      detailDesserts: [],
      detailDialog: false,
      detailDialogDelete: false,
      editedDetail: {\n`

  detailFieldList.forEach((field, i) => {
    if (field.alias) {
      template += `\t\t\t\t${field.alias}: { relation: '${field.relation}', items: [], value: null }`
    } else if (field.reference) {
      template += `\t\t\t\t${field.reference}: { relation: 'Many-to-Many', items: [], value: null }`
    } else {
      if (field.interface.type == 'text') template += `\t\t\t\t${field.name}: ''`
      if (field.interface.type == 'number') template += `\t\t\t\t${field.name}: 0`
      if (field.interface.type == 'date') template += `\t\t\t\t${field.name}: ${field.interface.defaultValue ? 'new Date().toISOString().substr(0, 10)' : 'null'}` 
    }

    if (i < detailFieldList.length - 1) {
      template += ',\n'
    } else {
      template += '\n'
    }
  })

  template += `\t\t\t},
      defaultDetail: {},\n`

  existDate = false
  for (let field of detailFieldList) {
    if (field.interface && field.interface.type == 'date') {
      existDate = true
      break
    }
  }

  if (existDate) {
    template += `\t\t\tdetailMenuPickers: {\n`

    detailFieldList.forEach((field, i) => {
      if (field.interface && field.interface.type == 'date') template += `\t\t\t\t${field.name}: false`

      if (i < detailFieldList.length - 1) {
        template += ',\n'
      } else {
        template += '\n'
      }
    })

    template += '\t\t\t},\n'
  }

  template += `\t\t\tdetailIndex: -1,
      deleteManyDialog: false, // MANY ROWS DIALOG
      selected: [],
      manyRowsAction: { items: ['Delete'], value: null },
      urlDetailParams: '?updatedAt[order]=desc'
    }
  },
  methods: {
    getData() {
      this.showTable = false

      this.$store.dispatch("getTitle")

      if (this.$store.state.${headerModel}.schema) {
        this.buildDesserts()
      } else {
        const obj = {
          requestMethod: 'GET',
          model: '${headerModel}',
          urlMethod: 'list',
          urlParams: this.urlHeaderParams,
          body: null
        }

        this.getNewData(obj, false, false)
      }

      const obj = {
        requestMethod: 'GET',
        model: '${detailModel}',
        urlMethod: 'schema',
        urlParams: '',
        body: null
      }

      this.defaultDetail = Object.assign({}, this.editedDetail)
      this.$store.dispatch('serverRequest', obj)
      .then(() => {
        this.detailSchema = this.$store.state.${detailModel}.schema
      })
      .catch(err => alert(err.response.data.message))
    },
    getNewData(obj, detail, closeDialog) {
      if (!detail) this.showTable = false

      this.$store.dispatch('serverRequest', obj)
      .then(res => {
        if (!detail) {
          this.buildDesserts()
          if (this.dialog && closeDialog) this.close()

          if (obj.urlMethod == 'add') {
            this.headerButton = true
            this.detailButton = false
            this.headerId = res.data.data.id
          } else if (obj.urlMethod == 'update') {
            this.detailButton = false
          }
        } else {
          this.buildDetailDesserts()
          if (this.detailDialog) this.closeDelete()
        }
      })
      .catch((err) => {
        alert(err.response.data.message)
        this.showTable = true
      })
    },
    buildDesserts() {
      const  ${headerModel}_list = this.$store.state.${headerModel}
      this.desserts = []

      for (let item of ${headerModel}_list.data) {
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
      
      this.headerSchema = ${headerModel}_list.schema
      this.showTable = true

      this.defaultItem = Object.assign({}, this.editedItem)
    },
    buildDetailDesserts() {
      const ${detailModel}_list = this.$store.state.${detailModel}
      this.detailDesserts = []

      for (let item of ${detailModel}_list.data) {
        this.detailDesserts.push({
          id: item.id,\n`

  detailFieldList.forEach((field, i) => {
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

    if (i < detailFieldList.length - 1) {
      template += ',\n'
    } else {
      template += '\n'
    }
  })
        
  template += `\t\t\t\t})
      }

      this.detailSchema = ${detailModel}_list.schema

      this.defaultDetail = Object.assign({}, this.editedDetail)
    },
    valueFormat(value, field, detail) {
      if (field != 'id') {
        if (detail) {
          if (this.detailSchema[field] && this.detailSchema[field].type == 'INTEGER') value = parseInt(value)
          if (this.detailSchema[field] && this.detailSchema[field].type == 'FLOAT') value = parseFloat(value.replace(',', ''))
        } else {
          if (this.headerSchema[field] && this.headerSchema[field].type == 'INTEGER') value = parseInt(value)
          if (this.headerSchema[field] && this.headerSchema[field].type == 'FLOAT') value = parseFloat(value.replace(',', ''))
        }
      } else {
        value = parseInt(value)
      }

      return value
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

  template += `\t\tgetAutocompleteValue(relation, value, field, refField, detail) {
      let response = null

      if (!detail) {
        if (relation == 'One-to-One') {
          for (let obj of this.editedItem[field].items) {
            if (value == obj[refField]) {
              response = obj.id
              break
            }
          }
        }
      } else {
        if (relation == 'One-to-One') {
          for (let obj of this.editedDetail[field].items) {
            if (value == obj[refField]) {
              response = obj.id
              break
            }
          }
        }
      }

      return response
    },
    getAutocompleteId(relation, value, field, refField) {
      let response = null

      if (relation == 'One-to-One') {
        for (let obj of this.editedDetail[field].items) {
          if (value == obj.id) {
            response = obj[refField]
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
      this.headerButton = false
      this.detailButton = true
      this.dialog = false
      
      this.$nextTick(() => {
        this.clearSelects()
        this.editedIndex = -1
        this.editedItem = Object.assign({}, this.defaultItem)

        this.detailDesserts = []
        this.headerId = null
      })
    },
    closeDelete() {
      this.dialogDelete = false

      this.$nextTick(() => {
        this.clearSelects()
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
        this.showTable = true
      })
    },
    deleteItem(item) {
      this.editedIndex = this.desserts.indexOf(item)
      this.deletedItem = Object.assign({}, item)
      this.dialogDelete = true
    },
    deleteItemConfirm() {
      this.showTable = false
      let body = { id: this.deletedItem.id }

      const obj = {
        requestMethod: 'DELETE',
        model: '${headerModel}',
        urlMethod: 'delete',
        urlParams: this.urlHeaderParams,
        body: body
      }

      this.$store.dispatch('serverRequest', obj)
      .then(() => {
        this.closeDelete()
        this.buildDesserts()
        this.showTable = true\n\n`

  let compoundField = ''

  for (let field of models[detailModel].foreignKeys) {
    if (field.compound) {
      compoundField = field.alias
      break
    }
  }

  template += `\t\t\t\tbody.foreignKey = '${compoundField}'
        obj.model = '${detailModel}'
        obj.urlParams = this.urlDetailParams

        this.$store.dispatch('serverRequest', obj)
        .catch((err) => alert(err.response.data.message))
      })
      .catch((err) => alert(err.response.data.message))
    },\n`

  let detailSelectFields = false
  for (let field of detailFieldList) {
    if (field.alias) {
      detailSelectFields = true
      break
    }
  }

  template += `\t\tsave() {
    let body = { id: this.headerId, records: [] }
    let row = {}\n`

  if (detailSelectFields) {
    template += `\t\tconst relationFields = [`

    detailFieldList.forEach((field, i) => {
      if (field.alias) {
        if (i > 0) {
          template += ` ,'${field.alias}'`
        } else {
          template += `'${field.alias}'`
        }
      }
    })
  
    template += `]\n`
  }
      
  template += `\t\t\tfor (let record of this.detailDesserts) {
        row = {}
        
        for (let field in record) {\n`

  if (detailSelectFields) {
    template += `\t\t\t\t\tif (record[field]) {
            if (relationFields.indexOf(field) > -1) {\n`

    detailFieldList.forEach(field => {
      if (field.alias) {
        let validation = ''
        if (field.relation == 'One-to-One') {
          validation = 'this.editedDetail[field].value'
          template += `\t\t\t\t\t\tif (${validation} && field == '${field.alias}') body[field] = ${validation}\n`
        }

        if (field.relation == 'One-to-Many') {
          validation = 'this.editedDetail[field].values'
          template += `\t\t\t\t\t\tif (${validation}.length && field == '${field.alias}') body[field] = ${validation}\n`
        }

      }
    })

    template += `\t\t\t\t\t\t} else {
              row[field] = this.valueFormat(record[field], field, true)
            }
          } else {
            row[field] = null
          }
        }\n\n`
  } else {
    template += `\t\t\t\t\tif (record[field]) {
            row[field] = this.valueFormat(record[field], field, true)
          } else {
            row[field] = null
          }\n\n`
  }
      
  template += `\t\t\t\trow.${compoundField} = this.headerId
        body.records.push(row)
      }
    
    const obj = {
        requestMethod: '',
        model: '${detailModel}',
        urlMethod: '',
        urlParams: this.urlDetailParams,
        body: body
      }
      
      if (this.editedIndex > -1) {
        obj.requestMethod = 'PUT'
        obj.urlMethod = 'update'

        this.getNewData(obj, false, true)
      } else {
        obj.requestMethod = 'POST'
        obj.urlMethod = 'add'

        this.getNewData(obj, false, true)
      }
    },
    editItem(item) {
      const obj = {
        requestMethod: 'GET',
        model: '${detailModel}',
        urlMethod: 'list',
        urlParams: \`?updatedAt[order]=desc&${compoundField}=\${item.id}\`,
        body: null
      }
      
      this.getNewData(obj, true, false)
      
      this.editedIndex = this.desserts.indexOf(item)
      this.editedItem = Object.assign({}, this.defaultItem)\n`

  if (selectFields) {
    template += `\t\t\tconst relationFields = [`

    fieldList.forEach((field, i) => {
      if (field.alias) {
        if (i > 0) {
          template += ` ,'${field.alias}'`
        } else {
          template += `'${field.alias}'`
        }
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

        template += `\t\t\t\t\t\tif (field == '${field.alias}') this.editedItem[field].value = this.getAutocompleteValue('${field.relation}', item[field], field, '${fieldRef}', false)\n`
      }
    })
    
    template += `\t\t\t\t\t}
        } else {
          this.editedItem[field] = this.valueFormat(item[field], field, false)
        }\n`
  } else {
    template += `\t\t\t\tif (item[field]) {
          this.editedItem[field] = this.valueFormat(item[field], field, false)
        }\n`
  }
        
  template += `\t\t\t}

      this.headerId = item.id
      
      this.headerButton = false
      this.detailButton = false
      this.dialog = true
    },
    convertToMoney(x) {
      return x
        .toFixed(2)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    },
    clearDetailSelects() {
      for (let field in this.defaultDetail) {
        if (this.defaultDetail[field] && this.defaultDetail[field].value) this.defaultDetail[field].value = null
        if (this.defaultDetail[field] && this.defaultDetail[field].values) this.defaultDetail[field].values = []
      }
    },
    closeDetail() {
      this.detailDialog = false
      this.$nextTick(() => {
        this.clearDetailSelects()
        this.editedDetail = Object.assign({}, this.defaultDetail)
        this.detailIndex = -1
      })
    },
    closeDetailDelete() {
      this.detailDialogDelete = false

      this.$nextTick(() => {
        this.clearDetailSelects()
        this.editedDetail = Object.assign({}, this.defaultDetail)
        this.detailIndex = -1
      })
    },
    deleteDetail(item) {
      this.detailIndex = this.detailDesserts.indexOf(item)
      this.detailDialogDelete = true
    },
    deleteDetailConfirm() {
      this.detailDesserts.splice(this.detailIndex, 1)
      this.closeDetailDelete()
    },
    saveHeader() {
      let body = {}\n`

  if (selectFields) {
    template += `\t\t\tconst relationFields = [`

    fieldList.forEach((field, i) => {
      if (field.alias) {
        if (i > 0) {
          template += ` ,'${field.alias}'`
        } else {
          template += `'${field.alias}'`
        }
      }
    })
  
    template += `]\n`
  }

  template += `\n\t\t\tfor (let field in this.editedItem) {\n`

  if (selectFields) {
    template += `\t\t\t\tif (this.editedItem[field]) {
          if (relationFields.indexOf(field) > -1) {\n`

    fieldList.forEach(field => {
      if (field.alias) {
        let validation = ''
        if (field.relation == 'One-to-One') {
          validation = 'this.editedItem[field].value'
          template += `\t\t\t\t\t\tif (${validation} && field == '${field.alias}') body[field] = ${validation}\n`
        }
        if (field.relation == 'One-to-Many') {
          validation = 'this.editedItem[field].values'
          template += `\t\t\t\t\t\tif (${validation}.length && field == '${field.alias}') body[field] = ${validation}\n`
        }
      }
    })
    
    template += `\t\t\t\t\t} else {
            body[field] = this.valueFormat(this.editedItem[field], field, true)
          }
        } else {
          body[field] = null
        }\n`
  } else {
    template += `\t\t\t\tif (this.editedItem[field]) {
          body[field] = this.valueFormat(this.editedItem[field], field, false)
        } else {
          body[field] = null
        }\n`
  }

  template += `\n\t\t\tconst obj = {
        requestMethod: '',
        model: 'asignacion_cabeceras',
        urlMethod: '',
        urlParams: this.urlHeaderParams,
        body: body
      }

      if (this.editedIndex > -1) {
        body.id = this.headerId
        obj.requestMethod = 'PUT'
        obj.urlMethod = 'update'

        this.getNewData(obj, false, false)
      } else {
        obj.requestMethod = 'POST'
        obj.urlMethod = 'add'

        this.getNewData(obj, false, false)
      }
    },
    saveDetail() {
      let row = {}\n`

  if (detailSelectFields) {
    template += `\t\t\tconst relationFields = [`

    detailFieldList.forEach((field, i) => {
      if (field.alias) {
        if (i > 0) {
          template += ` ,'${field.alias}'`
        } else {
          template += `'${field.alias}'`
        }
      }
    })
  
    template += `]\n`
  }

  template += `\n\t\t\tfor (let field in this.editedDetail) {\n`

  if (detailSelectFields) {
    template += `\t\t\t\tif (this.editedDetail[field]) {
          if (relationFields.indexOf(field) > -1) {\n`

    detailFieldList.forEach(field => {
      if (field.alias) {
        let validation = ''
        if (field.relation == 'One-to-One') validation = 'this.editedDetail[field].value'
        if (field.relation == 'One-to-Many') validation = 'this.editedDetail[field].values'

        let fieldRef = ''
        for (let obj of models[field.name].fields) {
          if (obj.name == 'name') {
            fieldRef = 'name'
            break
          }

          if (obj.unique) fieldRef = obj.name
        }

        template += `\t\t\t\t\t\tif (${validation} && field == '${field.alias}') row[field] = this.getAutocompleteId('${field.relation}', ${validation}, field, '${fieldRef}')\n`
      }
    })
    
    template += `\t\t\t\t\t} else {
            row[field] = this.valueFormat(this.editedDetail[field], field, true)
          }
        } else {
          row[field] = null
        }\n`
  } else {
    template += `\t\t\t\tif (this.editedDetail[field]) {
          if (this.detailSchema[field].type == 'FLOAT') {
            row[field] = this.convertToMoney(this.editedDetail[field], field, true)
          } else {
            row[field] = this.valueFormat(this.editedDetail[field], field, true)
          }
        } else {
          row[field] = null
        }\n`
  }
  
  template += `\t\t\t}
      
      if (this.detailIndex > -1) {
        Object.assign(this.detailDesserts[this.detailIndex], row)
      } else {
        this.detailDesserts.unshift(row)
      }
      
      this.closeDetail()
    },
    editDetail(item) {
      this.detailIndex = this.detailDesserts.indexOf(item)\n`

  if (detailSelectFields) {
    template += `\t\t\tconst relationFields = [`

    detailFieldList.forEach((field, i) => {
      if (field.alias) {
        if (i > 0) {
          template += ` ,'${field.alias}'`
        } else {
          template += `'${field.alias}'`
        }
      }
    })
  
    template += `]\n`
  }
      
  template += `\n\t\t\tfor (let field in this.editedDetail) {\n`
      
  if (detailSelectFields) {
    template += `\t\t\t\tif (item[field]) {
          if (relationFields.indexOf(field) > -1) {\n`

    detailFieldList.forEach(field => {
      if (field.alias) {
        let fieldRef = ''
        for (let obj of models[field.name].fields) {
          if (obj.name == 'name') {
            fieldRef = 'name'
            break
          }

          if (obj.unique) fieldRef = obj.name
        }

        template += `\t\t\t\t\t\tif (field == '${field.alias}') this.editedDetail[field].value = this.getAutocompleteValue('${field.relation}', item[field], field, '${fieldRef}', true)\n`
      }
    })
    
    template += `\t\t\t\t\t}
        } else {
          this.editedDetail[field] = this.valueFormat(item[field], field, false)
        }\n`
  } else {
    template += `\t\t\t\tif (item[field]) {
          this.editedDetail[field] = this.valueFormat(item[field], field, false)
        }\n`
  }
        
  template += `\t\t\t}
      
      this.detailDialog = true
    },
    closeDeleteMany() {
      this.deleteManyDialog = false
    },
    deleteManyConfirm() {
      const body = { records: this.selected.map(item => Object.assign({}, item)) }

      for (let obj of body.records) {
        this.editedItem.estado_asignacion.items.forEach(item => {
          if (item.nombre == obj.estado_asignacion) obj.estado_asignacion = item.id
        })

        this.editedItem.transportista_asignacion.items.forEach(item => {
          if (item.nombre == obj.transportista_asignacion) obj.transportista_asignacion = item.id
        })
      }

      const obj = {
        requestMethod: 'DELETE',
        model: 'asignacion_cabeceras',
        urlMethod: 'delete',
        urlParams: this.urlHeaderParams,
        body: body
      }

      this.$store.dispatch('serverRequest', obj)
      .then(() => {
        this.closeDelete()
        this.buildDesserts()
        this.showTable = true
        this.selected = []
        this.manyRowsAction.value = null
        this.deleteManyDialog = false
      })
      .catch((err) => alert(err.response.data.message))
    },
    getSelected() {
      if (this.manyRowsAction.value == 'Eliminar') {
        this.deleteManyDialog = true
      }
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

  if (detailSelectFields) {
    for (let field of detailFieldList) {
      if (field.alias) {
        template += `\t\t${field.name}() {
      if (this.$store.state.${field.name}.data.length > 0) {
        for (let item of this.$store.state.${field.name}.data) {
          this.editedDetail.${field.alias}.items.push({ model: '${field.name}', ...item })
        }
      }

      return this.editedDetail.${field.alias}.items
    },\n`
      }
    }
  }
    
  template += `\t\tformTitle() {
      if (this.editedIndex === -1) {
        return 'New'
      } else {
        return 'Edit'
      }
    },\n`

  if (selectFields || detailSelectFields) {
    template += `\t\tallRequestChecked() {
      let show = true\n\n`
  }

  if (selectFields) {
    for (let field of fieldList) {
      if (field.alias) template += `\t\t\tif (!this.editedItem.${field.alias}.items.length) show = false\n`
    }
  }

  if (detailSelectFields) {
    for (let field of detailFieldList) {
      if (field.alias) template += `\t\t\tif (!this.editedDetail.${field.alias}.items.length) show = false\n`
    }
  }

  if (selectFields || detailSelectFields) {
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