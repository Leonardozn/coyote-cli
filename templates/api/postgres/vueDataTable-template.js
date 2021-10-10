function content() {
    const template = `<template>
    <v-data-table :headers="headers" :items="desserts" :search="search" class="elevation-1">
        <template v-slot:top>
            <v-toolbar flat>
                <v-toolbar-title>{{\`\${compound ? headerKey.charAt(0).toUpperCase() + headerKey.slice(1) : model.charAt(0).toUpperCase() + model.slice(1)} List\`}}</v-toolbar-title>
                <v-divider class="mx-4" inset vertical></v-divider>
                <v-spacer></v-spacer>
                <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
                <v-spacer></v-spacer>
                
                <!-- MAIN DIALOG -->
                <v-dialog v-model="dialog" max-width="800px" persistent>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="primary" dark class="mb-2" v-bind="attrs" v-on="on">{{\`New \${compound ? headerKey : model}\`}}</v-btn>
                    </template>
                    
                    <v-card>
                        <v-card-title>
                            <span class="text-h5">{{ formTitle }}</span>
                        </v-card-title>

                        <v-card-text>
                            <v-container>
                                <v-row>
                                    <v-col v-for="(column, i) in headers" :key="i" v-show="column.value != 'actions'" cols="12" sm="6" md="4">
                                        <v-text-field v-if="column.type == 'text'" v-model="editedItem[column.value]" :label="column.text"></v-text-field>
                                        <v-text-field v-if="column.type == 'number'" type="number" v-model="editedItem[column.value]" :label="column.text"></v-text-field>
                                        <v-menu
                                            v-if="column.type == 'date'"
                                            v-model="menuPickers"
                                            :close-on-content-click="false"
                                            :nudge-right="40"
                                            transition="scale-transition"
                                            offset-y
                                            min-width="auto"
                                        >
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-text-field v-model="editedItem[column.value]" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                            </template>
                                            <v-date-picker v-model="editedItem[column.value]" @input="menuPickers = false"></v-date-picker>
                                        </v-menu>
                                        <template v-if="column.type == 'datetime'">
                                            <v-menu
                                                v-model="menuPickers"
                                                :close-on-content-click="false"
                                                :nudge-right="40"
                                                transition="scale-transition"
                                                offset-y
                                                min-width="auto"
                                            >
                                                <template v-slot:activator="{ on, attrs }">
                                                    <v-text-field v-model="editedItem[column.value].date" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                                </template>
                                                <v-date-picker v-model="editedItem[column.value].date" @input="menuPickers = false"></v-date-picker>
                                            </v-menu>
                                            <v-menu
                                                v-model="timePicker"
                                                :close-on-content-click="false"
                                                :nudge-right="40"
                                                :return-value.sync="editedItem[column.value].time"
                                                transition="scale-transition"
                                                offset-y
                                                max-width="290px"
                                                min-width="290px"
                                            >
                                                <template v-slot:activator="{ on, attrs }">
                                                    <v-text-field
                                                        v-model="editedItem[column.value].time"
                                                        label="Time"
                                                        prepend-icon="mdi-clock-time-four-outline"
                                                        readonly
                                                        v-bind="attrs"
                                                        v-on="on"
                                                    ></v-text-field>
                                                </template>
                                                <v-time-picker v-if="timePicker" v-model="editedItem[column.value].time" full-width></v-time-picker>
                                            </v-menu>
                                        </template>
                                        <v-checkbox v-if="column.type == 'checkbox'" v-model="editedItem[column.value]" :label="column.text"></v-checkbox>
                                        <v-autocomplete
                                            v-if="column.type == 'select' && !selectFields[column.value].multiple"
                                            v-model="editedItem[column.value].value"
                                            :items="editedItem[column.value].items"
                                            :label="column.text"
                                        >
                                        </v-autocomplete>
                                        <v-autocomplete
                                            v-if="column.type == 'select' && selectFields[column.value].multiple"
                                            multiple
                                            v-model="editedItem[column.value].values"
                                            :items="editedItem[column.value].items"
                                            :label="column.text"
                                        >
                                        </v-autocomplete>
                                    </v-col>
                                    <v-col v-show="showPassFields && model == 'user'" v-for="(column, i) in Object.keys(passFields)" :key="\`pass-\${i}\`" cols="12" sm="6" md="4">
                                        <v-text-field
                                            :label="column == 'pass' ? 'Password' : 'Confirm password'"
                                            type="password"
                                            v-model="passFields[column]"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>

                                <v-row v-if="compound">
                                    <v-btn color="primary" dark class="mb-2" @click="saveHeader" :disabled="headerButton">{{\`Save \${headerKey}\`}}</v-btn>

                                    <v-divider class="mx-4" inset vertical></v-divider>

                                    <!-- DETAIL DIALOG -->
                                    <v-dialog v-model="dialogDetail" max-width="700px" persistent>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn color="primary" dark class="mb-2" v-bind="attrs" v-on="on" :disabled="detailButton">Add Detail</v-btn>
                                        </template>

                                        <v-card>
                                        <v-card-title class="text-h5">NEW DETAIL</v-card-title>
                                        <v-card-text>
                                            <v-container>
                                                <v-row>
                                                    <v-col v-for="(column, i) in detailHeaders" :key="i" v-show="column.value != 'actions'" cols="12" sm="6" md="4">
                                                        <v-text-field v-if="column.type == 'text'" v-model="editedDetail[column.value]" :label="column.text"></v-text-field>
                                                        <v-text-field v-if="column.type == 'number'" type="number" v-model="editedDetail[column.value]" :label="column.text"></v-text-field>
                                                        <v-menu
                                                            v-if="column.type == 'date'"
                                                            v-model="menuPickers"
                                                            :close-on-content-click="false"
                                                            :nudge-right="40"
                                                            transition="scale-transition"
                                                            offset-y
                                                            min-width="auto"
                                                        >
                                                            <template v-slot:activator="{ on, attrs }">
                                                                <v-text-field v-model="editedDetail[column.value]" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                                            </template>
                                                            <v-date-picker v-model="editedDetail[column.value]" @input="menuPickers = false"></v-date-picker>
                                                        </v-menu>
                                                        <template v-if="column.type == 'datetime'">
                                                            <v-menu
                                                                v-model="menuPickers"
                                                                :close-on-content-click="false"
                                                                :nudge-right="40"
                                                                transition="scale-transition"
                                                                offset-y
                                                                min-width="auto"
                                                            >
                                                                <template v-slot:activator="{ on, attrs }">
                                                                    <v-text-field v-model="editedDetail[column.value].date" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                                                </template>
                                                                <v-date-picker v-model="editedDetail[column.value].date" @input="menuPickers = false"></v-date-picker>
                                                            </v-menu>
                                                            <v-menu
                                                                v-model="timePicker"
                                                                :close-on-content-click="false"
                                                                :nudge-right="40"
                                                                :return-value.sync="editedDetail[column.value].time"
                                                                transition="scale-transition"
                                                                offset-y
                                                                max-width="290px"
                                                                min-width="290px"
                                                            >
                                                                <template v-slot:activator="{ on, attrs }">
                                                                    <v-text-field
                                                                        v-model="editedDetail[column.value].time"
                                                                        label="Time"
                                                                        prepend-icon="mdi-clock-time-four-outline"
                                                                        readonly
                                                                        v-bind="attrs"
                                                                        v-on="on"
                                                                    ></v-text-field>
                                                                </template>
                                                                <v-time-picker v-if="timePicker" v-model="editedDetail[column.value].time" full-width></v-time-picker>
                                                            </v-menu>
                                                        </template>
                                                        <v-checkbox v-if="column.type == 'checkbox'" v-model="editedDetail[column.value]" :label="column.text"></v-checkbox>
                                                        <v-autocomplete
                                                            v-if="column.type == 'select' && !detailSelectFields[column.value].multiple"
                                                            v-model="editedDetail[column.value].value"
                                                            :items="editedDetail[column.value].items"
                                                            :label="column.text"
                                                        >
                                                        </v-autocomplete>
                                                        <v-autocomplete
                                                            v-if="column.type == 'select' && detailSelectFields[column.value].multiple"
                                                            multiple
                                                            v-model="editedDetail[column.value].values"
                                                            :items="editedDetail[column.value].items"
                                                            :label="column.text"
                                                        >
                                                        </v-autocomplete>
                                                    </v-col>
                                                </v-row>
                                            </v-container>
                                        </v-card-text>

                                        <v-card-actions>
                                            <v-spacer></v-spacer>
                                            <v-btn color="blue darken-1" text @click="closeDetail">Cancel</v-btn>
                                            <v-btn color="blue darken-1" text @click="saveDetail">Save</v-btn>
                                        </v-card-actions>
                                        </v-card>
                                    </v-dialog>

                                    <!-- DETAIL DIALOG DELETE -->
                                    <v-dialog v-model="detailDialogDelete" max-width="500px">
                                        <v-card>
                                        <v-card-title class="text-h5">Are you sure you want to delete this record?</v-card-title>
                                        <v-card-actions>
                                            <v-spacer></v-spacer>
                                            <v-btn color="blue darken-1" text @click="closeDetailDelete">Cancel</v-btn>
                                            <v-btn color="blue darken-1" text @click="deleteDetailConfirm">OK</v-btn>
                                            <v-spacer></v-spacer>
                                        </v-card-actions>
                                        </v-card>
                                    </v-dialog>
                                </v-row>
                                
                                <v-row v-if="compound">
                                    <template>
                                    <v-data-table
                                        :headers="detailHeaders"
                                        :items="detailDesserts"
                                        :items-per-page="5"
                                    >
                                        <template v-slot:item.actions="{ item }">
                                            <v-icon small class="mr-2" @click="editDetail(item)">mdi-pencil</v-icon>
                                            <v-icon small @click="deleteDetail(item)">mdi-delete</v-icon>
                                        </template>
                                    </v-data-table>
                                    </template>
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

                <!-- DIALOG DELETE -->
                <v-dialog v-model="dialogDelete" max-width="500px">
                    <v-card>
                    <v-card-title class="text-h5">{{deleteMessage}}</v-card-title>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
                        <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>
                        <v-spacer></v-spacer>
                    </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-toolbar>
        </template>

        <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
        </template>
    </v-data-table>
</template>

<script>
  import axios from 'axios'

  export default {
    data() {
        return {
            auth: \`Bearer \${this.\$store.state.accessToken}\`,
            search: '',
            headers: [],
            desserts: [],
            dialog: false,
            dialogDelete: false,
            editedIndex: -1,
            passFields: {},
            showPassFields: true,
            editedItem: {},
            defaultItem: {},
            selectFields: {},
            menuPickers: false,
            timePicker: false,
            headerButton: false,
            deleteMessage: '',
            compound: false,
            headerKey: '',
            headerAttr: '',
            detailHeaders: [],
            detailDesserts: [],
            dialogDetail: false,
            detailDialogDelete: false,
            detailIndex: -1,
            editedDetail: {},
            defaultDetail: {},
            detailSelectFields: {},
            detailButton: true
        }
    },
    props: ['model'],
    methods: {
        getData() {
            axios({
                method: 'GET',
                baseURL: \`http://localhost:8300/\${this.model}/schema\`,
                headers: { 'Authorization': \`\${this.auth}\` }
            })
            .then(async (response) => {
                let res = null
                let data = null
                let schema = null
                
                schema = response.data.data
                for (let column in schema) {
                    if (schema[column].type == 'foreignKey' && schema[column].compound) {
                        this.headerKey = column
                        this.compound = true
                    }
                }

                if (this.compound) {
                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${schema[this.headerKey].model}/list\`,
                        headers: { 'Authorization': \`\${this.auth}\` }
                    })
                    data = res.data.data
                    schema = res.data.schema
                    for (let attr in schema) {
                        if (schema[attr].unique) this.headerAttr = attr
                    }
                    this.dataBuilding(data, schema, false, true)

                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${this.model}/list\`,
                        headers: { 'Authorization': \`\${this.auth}\` }
                    })
                    data = res.data.data
                    for (let item of data) delete item[this.headerKey]
                    schema = res.data.schema
                    delete schema[this.headerKey]
                    this.dataBuilding(data, schema, true, false)
                } else {
                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${this.model}/list\`,
                        headers: { 'Authorization': \`\${this.auth}\` }
                    })
                    data = res.data.data
                    schema = res.data.schema
                    this.dataBuilding(data, schema, false, true)
                }
            })
            .catch(err => alert(err))
        },
        async dataBuilding(data, schema, detail, toList) {
            let type = ''
            let initVal = ''
            let foreignName = ''
            let foreignVals = []
            let list = []
            
            for (let column in schema) {
                if (!schema[column].hidden) {
                    if (schema[column].type == 'TEXT' || schema[column].type == 'UUID') {
                        type = 'text'
                        initVal = ''
                    }
                    if (schema[column].type == 'INTEGER' || schema[column].type == 'BIGINT' || schema[column].type == 'FLOAT' || schema[column].type == 'DOUBLE') {
                        type = 'number'
                        initVal = 0
                    }
                    if (schema[column].type == 'DATE') {
                        type = 'datetime'
                        initVal = new Date().toISOString().substr(0, 19)
                    }
                    if (schema[column].type == 'DATEONLY') {
                        type = 'date'
                        initVal = new Date().toISOString().substr(0, 10)
                    }
                    if (schema[column].type == 'BOOLEAN') {
                        type = 'checkbox'
                        initVal = false
                    }
                    if (schema[column].type == 'foreignKey') {
                        type = 'select'
                        foreignName = \`\${column}Id\`
                        foreignVals = await axios({
                            method: 'GET',
                            baseURL: \`http://localhost:8300/\${schema[column].model}/list\`,
                            headers: { 'Authorization': \`\${this.auth}\` }
                        })
                        initVal = null
                        
                        if (!detail) {
                            this.selectFields[foreignName] = {
                                label: '',
                                multiple: schema[column].relation == 'One-to-Many' ? true : false,
                                values: foreignVals.data.data
                            }
                        } else {
                            this.detailSelectFields[foreignName] = {
                                label: '',
                                multiple: schema[column].relation == 'One-to-Many' ? true : false,
                                values: foreignVals.data.data
                            }
                        }
                        
                        if (foreignVals.data.data[0]) {
                            if (foreignVals.data.data[0].name) {
                                if (!detail) {
                                    this.selectFields[foreignName].label = 'name'
                                } else {
                                    this.detailSelectFields[foreignName].label = 'name'
                                }
                            } else {
                                let foreignSchema = foreignVals.data.schema
                                
                                for (let field in foreignSchema) {
                                    if (field != 'id' && foreignSchema[field].unique) {
                                        if (!detail) {
                                            this.selectFields[foreignName].label = field
                                        } else {
                                            this.detailSelectFields[foreignName].label = field
                                        }
                                        break
                                    }
                                }
                            }
                        }
                    }
    
                    if (schema[column].type == 'foreignKey') {
                        list.push({ text: schema[column].label ? schema[column].label : column, value: foreignName, type: type })
                    } else {
                        list.push({ text: schema[column].label ? schema[column].label : column, value: column, type: type })
                    }
                    
                    if (schema[column].type == 'foreignKey') {
                        if (!detail) {
                            this.editedItem[foreignName] = {}
                            this.editedItem[foreignName]['items'] = []
                            
                            this.defaultItem[foreignName] = {}
                            this.defaultItem[foreignName]['items'] = []
    
                            if (schema[column].relation == 'One-to-One') {
                                this.editedItem[foreignName]['value'] = initVal
                                this.defaultItem[foreignName]['value'] = initVal
                            } else if (schema[column].relation == 'One-to-Many') {
                                this.editedItem[foreignName]['values'] = []
                                this.defaultItem[foreignName]['values'] = []
                            }
                            
                            foreignVals.data.data.forEach(item => {
                                this.editedItem[foreignName]['items'].push(item[this.selectFields[foreignName].label])
                                this.defaultItem[foreignName]['items'].push(item[this.selectFields[foreignName].label])
                            })
                        } else {
                            this.editedDetail[foreignName] = {}
                            this.editedDetail[foreignName]['items'] = []
                            
                            this.defaultDetail[foreignName] = {}
                            this.defaultDetail[foreignName]['items'] = []
    
                            if (schema[column].relation == 'One-to-One') {
                                this.editedDetail[foreignName]['value'] = initVal
                                this.defaultDetail[foreignName]['value'] = initVal
                            } else if (schema[column].relation == 'One-to-Many') {
                                this.editedDetail[foreignName]['values'] = []
                                this.defaultDetail[foreignName]['values'] = []
                            }
                            
                            foreignVals.data.data.forEach(item => {
                                this.editedDetail[foreignName]['items'].push(item[this.detailSelectFields[foreignName].label])
                                this.defaultDetail[foreignName]['items'].push(item[this.detailSelectFields[foreignName].label])
                            })
                        }
                    } else if (schema[column].type == 'DATE') {
                        if (!detail) {
                            this.editedItem[column] = {}
                            this.editedItem[column].date = initVal.substr(0, 10)
                            this.editedItem[column].time = initVal.substr(11, 19)
    
                            this.defaultItem[column] = {}
                            this.defaultItem[column].date = initVal.substr(0, 10)
                            this.defaultItem[column].time = initVal.substr(11, 19)
                        } else {
                            this.editedDetail[column] = {}
                            this.editedDetail[column].date = initVal.substr(0, 10)
                            this.editedDetail[column].time = initVal.substr(11, 19)
    
                            this.defaultDetail[column] = {}
                            this.defaultDetail[column].date = initVal.substr(0, 10)
                            this.defaultDetail[column].time = initVal.substr(11, 19)
                        }
                    } else {
                        if (!detail) {
                            this.editedItem[column] = initVal
                            this.defaultItem[column] = initVal
                        } else {
                            this.editedDetail[column] = initVal
                            this.defaultDetail[column] = initVal
                        }
                    }
                }
            }

            if (this.auth) {
                this.passFields.pass = ''
                this.passFields.confirmPass = ''
            }
            
            list.push({ text: 'Actions', value: 'actions', sortable: false })
            if (!detail) {
                this.headers = list
            } else {
                this.detailHeaders = list
            }
            
            list = []

            if (toList) {
                if (data.length) {
                    for (let row of data) {
                        for (let attr in row) {
                            if (!detail) {
                                for (let field in this.selectFields) {
                                    if (field == attr) row[attr] = row[attr][this.selectFields[field].label]
                                }
                            } else {
                                for (let field in this.detailSelectFields) {
                                    if (field == attr) row[attr] = row[attr][this.detailSelectFields[field].label]
                                }
                            }
                            
                            if (schema[attr] && schema[attr].type == 'DATE') row[attr] = row[attr].substr(0, 19)
                            if (schema[attr] && schema[attr].type == 'DATEONLY') row[attr] = row[attr].substr(0, 10)
                        }
                        
                        list.push(row)
                    }
                    if (!detail) {
                        this.desserts = list
                    } else {
                        this.detailDesserts = list
                    }
                }
            }
        },
        async editItem (item) {
            this.showPassFields = false
            let record = {...item}
            
            for (let attr in record) {
                for (let field in this.selectFields) {
                    if (field == attr) {
                        record[attr] = {}
                        record[attr].items = this.editedItem[attr].items
                        record[attr].value = item[attr]
                    }
                }

                if (this.editedItem[attr] && this.editedItem[attr].date) {
                    record[attr] = {}
                    record[attr].date = item[attr].substr(0, 10)
                    record[attr].time = item[attr].substr(11, 19)
                }
            }
            
            this.editedIndex = this.desserts.indexOf(item)
            this.editedItem = Object.assign({}, record)

            if (this.compound) {
                let res = await axios({
                    method: 'GET',
                    baseURL: \`http://localhost:8300/\${this.model}/list?\${this.headerKey}=\${item.id}\`,
                    headers: { 'Authorization': \`\${this.auth}\` }
                })
                let data = res.data.data
                for (let obj of data) delete obj[\`\${this.headerKey}Id\`]
                let schema = res.data.schema
                delete schema[this.headerKey]
                this.dataBuilding(data, schema, true, true)
            }
            
            this.headerButton = false
            this.detailButton = false
            this.dialog = true
        },
        editDetail (item) {
            let record = {...item}
            
            for (let attr in record) {
                for (let field in this.detailSelectFields) {
                    if (field == attr) {
                        record[attr] = {}
                        record[attr].items = this.editedDetail[attr].items
                        record[attr].value = item[attr]
                    }
                }

                if (this.editedDetail[attr] && this.editedDetail[attr].date) {
                    record[attr] = {}
                    record[attr].date = item[attr].substr(0, 10)
                    record[attr].time = item[attr].substr(11, 19)
                }
            }

            this.detailIndex = this.detailDesserts.indexOf(item)
            this.editedDetail = Object.assign({}, record)
            this.dialogDetail = true
        },
        deleteItem (item) {
            if (this.compound) {
                this.deleteMessage = \`Deleting this \${this.headerKey} will also delete its \${this.model}.\\nAre you sure?\`
            } else {
                this.deleteMessage = \`Are you sure you want to delete this \${this.model}?\`
            }

            this.editedIndex = this.desserts.indexOf(item)
            this.editedItem = Object.assign({}, item)
            this.dialogDelete = true
        },
        deleteDetail (item) {
            this.detailIndex = this.detailDesserts.indexOf(item)
            this.editedDetail = Object.assign({}, item)
            this.detailDialogDelete = true
        },
        deleteItemConfirm () {
            let body = {}

            if (this.compound) {
                body.id = this.editedItem.id
                body.foreignKey = this.headerKey

                axios({
                    method: 'POST',
                    baseURL: \`http://localhost:8300/\${this.model}/delete\`,
                    data: body,
                    headers: { 'Authorization': \`\${this.auth}\` }
                })
                .then(() => {
                    delete body.foreignKey

                    axios({
                        method: 'POST',
                        baseURL: \`http://localhost:8300/\${this.headerKey}/delete\`,
                        data: body,
                        headers: { 'Authorization': \`\${this.auth}\` }
                    })
                    .then(() => {
                        this.getData()
                        this.closeDelete()
                    })
                    .catch(err => alert(err))
                })
                .catch(err => alert(err))
            } else {
                body.id = this.editedItem.id
                axios({
                    method: 'POST',
                    baseURL: \`http://localhost:8300/\${this.model}/delete\`,
                    data: body,
                    headers: { 'Authorization': \`\${this.auth}\` }
                })
                .then(() => {
                    this.getData()
                    this.closeDelete()
                })
                .catch(err => alert(err))
            }
        },
        deleteDetailConfirm () {
            this.detailDesserts.splice(this.detailIndex, 1)
            this.closeDetailDelete()
        },
        close () {
            this.dialog = false
            this.\$nextTick(() => {
                for (let attr in this.defaultItem) {
                    if (this.defaultItem[attr].value) this.defaultItem[attr].value = null
                    if (this.defaultItem[attr].values) this.defaultItem[attr].values = []
                }
                this.editedItem = Object.assign({}, this.defaultItem)
                this.editedIndex = -1

                if (this.compound) {
                    for (let attr in this.defaultDetail) {
                        if (this.defaultDetail[attr].value) this.defaultDetail[attr].value = null
                        if (this.defaultDetail[attr].values) this.defaultDetail[attr].values = []
                    }
                    this.editedDetail = Object.assign({}, this.defaultDetail)
                    this.detailIndex = -1

                    this.detailDesserts = []
                }

                if (this.auth) {
                    this.showPassFields = true
                    this.passFields.pass = ''
                    this.passFields.confirmPass = ''
                }
            })
        },
        closeDetail () {
            this.dialogDetail = false
            this.\$nextTick(() => {
                this.editedDetail = Object.assign({}, this.defaultDetail)
                this.detailIndex = -1
            })
        },
        closeDelete () {
            this.dialogDelete = false
            this.\$nextTick(() => {
                this.editedItem = Object.assign({}, this.defaultItem)
                this.editedIndex = -1
            })
        },
        closeDetailDelete () {
            this.detailDialogDelete = false
            this.\$nextTick(() => {
                this.editedDetail = Object.assign({}, this.defaultDetail)
                this.detailIndex = -1
            })
        },
        editForeignAttributes(body) {
            let obj = {}
            for (let attr in body) {
                let chars = attr.split('')
                if (chars[chars.length-2] == 'I' && chars[chars.length-1] == 'd') {
                    chars.splice(chars.length-1, 1)
                    chars.splice(chars.length-1, 1)
                    obj[chars.join('')] = body[attr]
                } else {
                    obj[attr] = body[attr]
                }
            }

            return obj
        },
        save () {
            let errors = null
            let body = {}
            let obj = {}

            for (let attr in this.editedItem) {
                if (this.editedItem[attr].values) {
                    body.records = []
                } else {
                    if (!this.editedItem[attr].items) obj[attr] = this.editedItem[attr]
                }
            }

            if (this.compound) body.records = []
            
            if (body.records) {
                for (let attr in this.editedItem) {
                    if (this.editedItem[attr].values) {
                        for (let value of this.editedItem[attr].values) {
                            for (let val of this.selectFields[attr].values) {
                                if (value == val[this.selectFields[attr].label]) {
                                    obj[attr] = val.id
                                }
                            }
                        }
                    } else if (this.editedItem[attr].value) {
                        for (let val of this.selectFields[attr].values) {
                            if (this.editedItem[attr].value == val[this.selectFields[attr].label]) {
                                obj[attr] = val.id
                            }
                        }
                    } else if (this.editedItem[attr].date) {
                        obj[attr] = \`\${this.editedItem[attr].date} \${this.editedItem[attr].time}\`
                    }
                }

                if (this.compound) {
                    for (let item of this.detailDesserts) {
                        for (let attr in item) {
                            if (this.detailSelectFields[attr]) {
                                for (let val of this.detailSelectFields[attr].values) {
                                    if (item[attr] == val[this.detailSelectFields[attr].label]) {
                                        item[attr] = val.id
                                    }
                                }
                            }
                        }
                        
                        for (let element of this.desserts) {
                            if (element[this.headerAttr] == obj[this.headerAttr]) item[this.headerKey] = element.id
                        }

                        body.records.push(item)
                    }
                } else {
                    body.records.push(obj)
                }
            } else {
                for (let attr in this.editedItem) {
                    if (this.editedItem[attr].items) {
                        for (let val of this.selectFields[attr].values) {
                            if (this.editedItem[attr].value == val[this.selectFields[attr].label]) {
                                body[attr] = val.id
                            }
                        }
                    } else if (this.editedItem[attr].date) {
                        body[attr] = \`\${this.editedItem[attr].date} \${this.editedItem[attr].time}\`
                    } else {
                        body[attr] = this.editedItem[attr]
                    }
                }

                if (this.showPassFields && this.auth) {
                    if (this.passFields.pass.trim() === this.passFields.confirmPass.trim()) {
                        body.password = this.passFields.pass.trim()
                    } else {
                        errors = 'Passwords do not match, please check them.'
                    }
                }
            }

            if (body.records) {
                for (let i=0; i<body.records.length; i++) body.records[i] = this.editForeignAttributes(body.records[i])
            } else {
                body = this.editForeignAttributes(body)
            }
            
            if (this.editedIndex > -1) {
                axios({
                    method: 'PUT',
                    baseURL: \`http://localhost:8300/\${this.model}/update\`,
                    data: body,
                    headers: { 'Authorization': \`\${this.auth}\` }
                })
                .then(() => this.getData())
                .catch(err => alert(err))
            } else {
                if (!errors) {
                    delete body.id
                    
                    axios({
                        method: 'POST',
                        baseURL: \`http://localhost:8300/\${this.model}/add\`,
                        data: body,
                        headers: { 'Authorization': \`\${this.auth}\` }
                    })
                    .then(() => this.getData())
                    .catch(err => alert(err))

                    errors = null
                } else {
                    alert(errors)
                }
            }
            
            if (!errors) this.close()
        },
        saveHeader() {
            let body = {}
            let method = 'post'
            let urlMethod = 'add'
            
            for (let attr in this.editedItem) {
                if (this.editedItem[attr].items) {
                    for (let val of this.selectFields[attr].values) {
                        if (this.editedItem[attr].value == val[this.selectFields[attr].label]) {
                            body[attr] = val.id
                        }
                    }
                } else if (this.editedItem[attr] && this.editedItem[attr].date) {
                    body[attr] = \`\${this.editedItem[attr].date} \${this.editedItem[attr].time}\`
                } else {
                    body[attr] = this.editedItem[attr]
                }
            }

            body = this.editForeignAttributes(body)
            if (this.editedIndex > -1) {
                method = 'put'
                urlMethod = 'update'
            }
            
            axios({
                method,
                baseURL: \`http://localhost:8300/\${this.headerKey}/\${urlMethod}\`,
                data: body,
                headers: { 'Authorization': \`\${this.auth}\` }
            })
            .then(async () => {
                let res = await axios({
                    method: 'GET',
                    baseURL: \`http://localhost:8300/\${this.headerKey}/list\`,
                    data: body,
                    headers: { 'Authorization': \`\${this.auth}\` }
                })
                let data = res.data.data
                let schema = res.data.schema
                let list = []
                
                for (let row of data) {
                    for (let attr in row) {
                        for (let field in this.selectFields) {
                            if (field == attr) row[attr] = row[attr][this.selectFields[field].label]
                        }
                        
                        if (schema[attr] && schema[attr].type == 'DATE') row[attr] = row[attr].substr(0, 19)
                        if (schema[attr] && schema[attr].type == 'DATEONLY') row[attr] = row[attr].substr(0, 10)
                    }
                    
                    list.push(row)
                }
                
                this.desserts = list
                this.headerButton = true
                this.detailButton = false
            })
            .catch(err => alert(err))
        },
        saveDetail() {
            let row = {}
            let obj = {}

            for (let attr in this.editedDetail) {
                if (this.editedDetail[attr].values) {
                    row.records = []
                } else {
                    if (!this.editedDetail[attr].items) obj[attr] = this.editedDetail[attr]
                }
            }

            if (row.records) {
                for (let attr in this.editedDetail) {
                    if (this.editedDetail[attr].items) {
                        for (let value of this.editedDetail[attr].values) {
                            for (let val of this.detailSelectFields[attr].values) {
                                if (value == val[this.detailSelectFields[attr].label]) {
                                    row.records.push({ ...obj, [attr]: val[this.detailSelectFields[attr].label] })
                                }
                            }
                        }
                    }

                    if (this.editedDetail[attr] && this.editedDetail[attr].date) {
                        row.records.push({ ...obj, [attr]: \`\${this.editedDetail[attr].date} \${this.editedDetail[attr].time}\` })
                    }
                }
            } else {
                for (let attr in this.editedDetail) {
                    if (this.editedDetail[attr].items) {
                        for (let val of this.detailSelectFields[attr].values) {
                            if (this.editedDetail[attr].value == val[this.detailSelectFields[attr].label]) {
                                row[attr] = val[this.detailSelectFields[attr].label]
                            }
                        }
                    } else if (this.editedDetail[attr] && this.editedDetail[attr].date) {
                        row[attr] = \`\${this.editedDetail[attr].date} \${this.editedDetail[attr].time}\`
                    } else {
                        row[attr] = this.editedDetail[attr]
                    }
                }
            }

            if (this.detailIndex > -1) {
                Object.assign(this.detailDesserts[this.detailIndex], this.editedDetail)
            } else {
                if (row.records) {
                    for (let i=0; i<row.records.length; i++) {
                        row.records[i] = this.editForeignAttributes(row.records[i])
                        this.detailDesserts.push(row.records[i])
                    }
                } else {
                    row = this.editForeignAttributes(row)
                    this.detailDesserts.push(row)
                }
            }

            this.closeDetail()
        }
    },
    computed: {
        formTitle() {
            const dialogTitle = this.compound ? this.headerKey : this.model
            return this.editedIndex === -1 ? \`New \${dialogTitle}\` : \`Edit \${dialogTitle}\`
        }
    },
    watch: {
        dialog (val) {
            val || this.close()
        },
        dialogDelete (val) {
            val || this.closeDelete()
        },
        dialogDetail (val) {
            val || this.closeDetail()
        },
        detailDialogDelete (val) {
            val || this.closeDetailDelete()
        },
    },
    beforeMount() {
        this.getData()
    }
  }
</script>`

  return template
}

module.exports = content