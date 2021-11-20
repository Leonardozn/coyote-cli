function content() {
    const template = `<template>
    <v-data-table :headers="headers" :items="desserts" :search="search" class="elevation-1">
        <template v-slot:top>
            <v-toolbar flat>
                <v-toolbar-title>{{\`\${title} List\`}}</v-toolbar-title>
                <v-divider class="mx-4" inset vertical></v-divider>
                <v-spacer></v-spacer>
                <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
                <v-spacer></v-spacer>
                
                <!-- MAIN DIALOG -->
                <v-dialog v-model="dialog" max-width="800px" persistent>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="primary" dark class="mb-2" v-bind="attrs" v-on="on">{{\`New \${title}\`}}</v-btn>
                    </template>
                    
                    <v-card>
                        <v-card-title>
                            <span class="text-h5">{{ formTitle }}</span>
                        </v-card-title>

                        <v-card-text>
                            <v-container>
                                <v-row>
                                    <v-col v-for="(column, i) in formHeaders" :key="i" v-show="column.value != 'actions'" cols="12" sm="6" md="4">
                                        <v-text-field v-if="column.type == 'text'" v-model="editedItem[column.value]" :label="column.text"></v-text-field>
                                        <v-text-field v-if="column.type == 'number'" type="number" v-model="editedItem[column.value]" :label="column.text"></v-text-field>
                                        <v-text-field 
                                            v-if="column.type == 'autoIncrement' && editedIndex > -1"
                                            v-model="editedItem[column.value]"
                                            :label="column.text"
                                            readonly
                                        >
                                        </v-text-field>
                                        <v-menu
                                            v-if="column.type == 'date'"
                                            v-model="menuPickers[column.value]"
                                            :close-on-content-click="false"
                                            :nudge-right="40"
                                            transition="scale-transition"
                                            offset-y
                                            min-width="auto"
                                        >
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-text-field v-model="editedItem[column.value]" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                            </template>
                                            <v-date-picker v-model="editedItem[column.value]" @input="menuPickers[column.value] = false"></v-date-picker>
                                        </v-menu>
                                        <template v-if="column.type == 'datetime'">
                                            <v-menu
                                                v-model="menuPickers[column.value]"
                                                :close-on-content-click="false"
                                                :nudge-right="40"
                                                transition="scale-transition"
                                                offset-y
                                                min-width="auto"
                                            >
                                                <template v-slot:activator="{ on, attrs }">
                                                    <v-text-field v-model="editedItem[column.value].date" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                                </template>
                                                <v-date-picker v-model="editedItem[column.value].date" @input="menuPickers[column.value] = false"></v-date-picker>
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
                                            v-if="column.type == 'select' && selectFields[column.value] && !selectFields[column.value].multiple"
                                            v-model="editedItem[column.value].value"
                                            :items="editedItem[column.value].items"
                                            :label="column.text"
                                        >
                                        </v-autocomplete>
                                        <v-autocomplete
                                            v-if="column.type == 'select' && selectFields[column.value] && selectFields[column.value].multiple && selectFields[column.value].relation != 'Many-to-Many'"
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
                                    <v-btn color="primary" dark class="mb-2" @click="saveHeader" :disabled="headerButton">{{\`Save \${title}\`}}</v-btn>

                                    <v-divider class="mx-4" inset vertical></v-divider>

                                    <!-- DETAIL DIALOG -->
                                    <v-dialog v-model="dialogDetail" max-width="700px" persistent>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn color="primary" dark class="mb-2" v-bind="attrs" v-on="on" :disabled="detailButton">{{\`Add \${title} detail\`}}</v-btn>
                                        </template>

                                        <v-card>
                                        <v-card-title class="text-h5">{{\`\${formTitle} detail\`}}</v-card-title>
                                        <v-card-text>
                                            <v-container>
                                                <v-row>
                                                    <v-col v-for="(column, i) in detailFormHeaders" :key="i" v-show="column.value != 'actions'" cols="12" sm="6" md="4">
                                                        <v-text-field v-if="column.type == 'text'" v-model="editedDetail[column.value]" :label="column.text"></v-text-field>
                                                        <v-text-field v-if="column.type == 'number'" type="number" v-model="editedDetail[column.value]" :label="column.text"></v-text-field>
                                                        <v-text-field 
                                                            v-if="column.type == 'autoIncrement' && detailIndex > -1"
                                                            v-model="editedDetail[column.value]"
                                                            :label="column.text"
                                                            readonly
                                                        >
                                                        </v-text-field>
                                                        <v-menu
                                                            v-if="column.type == 'date'"
                                                            v-model="detailMenuPickers[column.value]"
                                                            :close-on-content-click="false"
                                                            :nudge-right="40"
                                                            transition="scale-transition"
                                                            offset-y
                                                            min-width="auto"
                                                        >
                                                            <template v-slot:activator="{ on, attrs }">
                                                                <v-text-field v-model="editedDetail[column.value]" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                                            </template>
                                                            <v-date-picker v-model="editedDetail[column.value]" @input="detailMenuPickers[column.value] = false"></v-date-picker>
                                                        </v-menu>
                                                        <template v-if="column.type == 'datetime'">
                                                            <v-menu
                                                                v-model="detailMenuPickers[column.value]"
                                                                :close-on-content-click="false"
                                                                :nudge-right="40"
                                                                transition="scale-transition"
                                                                offset-y
                                                                min-width="auto"
                                                            >
                                                                <template v-slot:activator="{ on, attrs }">
                                                                    <v-text-field v-model="editedDetail[column.value].date" :label="column.text" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                                                                </template>
                                                                <v-date-picker v-model="editedDetail[column.value].date" @input="detailMenuPickers[column.value] = false"></v-date-picker>
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
                                                            v-if="column.type == 'select' && detailSelectFields[column.value] && !detailSelectFields[column.value].multiple"
                                                            v-model="editedDetail[column.value].value"
                                                            :items="editedDetail[column.value].items"
                                                            :label="column.text"
                                                        >
                                                        </v-autocomplete>
                                                        <v-autocomplete
                                                            v-if="column.type == 'select' && detailSelectFields[column.value] && detailSelectFields[column.value].multiple"
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

                                <!-- MANY TO MANY FIELDS -->
                                <v-row v-if="manyToManyModel">
                                    <v-btn color="primary" dark class="mb-2" @click="saveHeader">{{\`Save \${model}\`}}</v-btn>
                                </v-row>

                                <v-row v-if="manyToManyModel">
                                    <v-col v-for="(column, i) in manyHeaders" :key="i" v-show="column.value != 'actions'" cols="12" sm="6" md="4">
                                        <v-autocomplete
                                            v-if="column.type == 'select' && selectFields[column.value].multiple"
                                            multiple
                                            v-model="editedItem[column.value].values"
                                            :items="editedItem[column.value].items"
                                            :label="column.text"
                                        >
                                        </v-autocomplete>
                                    </v-col>
                                </v-row>
                                
                                <!-- DETAIL DATA TABLE -->
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
            title: '',
            search: '',
            headers: [],
            formHeaders: [],
            manyHeaders: [],
            desserts: [],
            dialog: false,
            dialogDelete: false,
            editedIndex: -1,
            passFields: {},
            showPassFields: true,
            editedItem: {},
            deletedItem: {},
            defaultItem: {},
            selectFields: {},
            menuPickers: {},
            timePicker: false,
            headerButton: false,
            deleteMessage: '',
            manyToManyModel: null,
            compound: false,
            headerModel: {
                modelName: '',
                fieldName: '',
                newId: null
            },
            detailHeaders: [],
            detailFormHeaders: [],
            detailDesserts: [],
            dialogDetail: false,
            detailDialogDelete: false,
            detailIndex: -1,
            editedDetail: {},
            defaultDetail: {},
            detailSelectFields: {},
            detailMenuPickers: {},
            detailButton: true,
            errors: null
        }
    },
    props: ['model'],
    methods: {
        async getData() {
            await this.$store.dispatch('verifyToken')

            this.$store.dispatch('getTitle')
            this.title = this.$store.state.menuOption

            axios({
                method: 'GET',
                baseURL: \`http://localhost:8300/\${this.model}/schema\`,
                headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
            })
            .then(async (response) => {
                let res = null
                let data = null
                let schema = null
                
                schema = response.data.data
                for (let column in schema) {
                    if (schema[column].type == 'foreignKey' && schema[column].compound) {
                        this.headerModel.modelName = schema[column].model
                        this.headerModel.fieldName = column
                        this.compound = true
                    } else if (schema[column].type == 'foreignKey' && schema[column].relation == 'Many-to-Many') {
                        this.manyToManyModel = schema[column].table
                    }
                }

                if (this.compound) {

                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${this.headerModel.modelName}/list?updatedAt[order]=desc\`,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                    })
                    data = res.data.data
                    schema = res.data.schema
                    this.dataBuilding(data, schema, false, true)

                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${this.model}/list?updatedAt[order]=desc\`,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                    })
                    data = res.data.data
                    for (let item of data) delete item[this.headerModel.fieldName]
                    schema = res.data.schema
                    delete schema[this.headerModel.fieldName]
                    this.dataBuilding(data, schema, true, false)

                } else if (this.manyToManyModel) {
                    this.headerModel.modelName = this.model

                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${this.model}/list?updatedAt[order]=desc\`,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                    })
                    data = res.data.data
                    schema = res.data.schema
                    this.dataBuilding(data, schema, false, true)

                    let ref = null
                    for (let column in schema) {
                        if (schema[column].relation == 'Many-to-Many') ref = schema[column].model
                    }

                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${ref}/list?updatedAt[order]=desc\`,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                    })
                    schema = res.data.schema
                    this.dataBuilding(data, schema, false, true)

                } else {

                    res = await axios({
                        method: 'GET',
                        baseURL: \`http://localhost:8300/\${this.model}/list?updatedAt[order]=desc\`,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
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
            let formList = []
            let manyToManyList = []
            let relation = null
            
            for (let column in schema) {
                if (!schema[column].hidden) {
                    if (schema[column].type == 'TEXT' || schema[column].type == 'UUID') {
                        type = 'text'
                        initVal = ''
                    }
                    if (schema[column].type == 'INTEGER' || schema[column].type == 'BIGINT' || schema[column].type == 'FLOAT' || schema[column].type == 'DOUBLE') {
                        if (schema[column].coyoteAutoIncrement) {
                            type = 'autoIncrement'
                        } else {
                            type = 'number'
                        }
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
                        await this.$store.dispatch('verifyToken')

                        type = 'select'
                        relation = schema[column].relation
                        foreignName = relation == 'Many-to-Many' ? column : schema[column].alias
                        if (relation == 'Many-to-Many') this.headerModel.modelName = this.model
                        
                        foreignVals = await axios({
                            method: 'GET',
                            baseURL: \`http://localhost:8300/\${schema[column].model}/list?updatedAt[order]=desc\`,
                            headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                        })
                        initVal = null
                        
                        if (!detail) {
                            this.selectFields[column] = {
                                label: '',
                                alias: foreignName,
                                relation,
                                multiple: relation == 'One-to-Many' || relation == 'Many-to-Many' ? true : false,
                                values: foreignVals.data.data
                            }
                        } else {
                            this.detailSelectFields[column] = {
                                label: '',
                                alias: foreignName,
                                relation,
                                multiple: relation == 'One-to-Many' ? true : false,
                                values: foreignVals.data.data
                            }
                        }

                        if (relation == 'Many-to-Many') {
                            manyToManyList.push({ text: schema[column].label ? schema[column].label : column, value: column, type: type })
                        }
                        
                        if (foreignVals.data.data[0]) {
                            if (foreignVals.data.data[0].name) {
                                if (!detail) {
                                    this.selectFields[column].label = 'name'
                                } else {
                                    this.detailSelectFields[column].label = 'name'
                                }
                            } else {
                                let foreignSchema = foreignVals.data.schema
                                
                                for (let field in foreignSchema) {
                                    if (field != 'id' && foreignSchema[field].unique) {
                                        if (!detail) {
                                            this.selectFields[column].label = field
                                        } else {
                                            this.detailSelectFields[column].label = field
                                        }
                                        break
                                    }
                                }
                            }
                        }
                    }
    
                    if (schema[column].type != 'foreignKey') {
                        list.push({ text: schema[column].label ? schema[column].label : column, value: column, type: type })
                    } else if ((schema[column].type == 'foreignKey' && relation == 'One-to-One')) {
                        list.push({ text: schema[column].label ? schema[column].label : foreignName, value: foreignName, type: type })
                    }

                    formList.push({ text: schema[column].label ? schema[column].label : column, value: column, type: type })
                    
                    if (schema[column].type == 'foreignKey') {
                        if (!detail) {
                            this.editedItem[column] = {}
                            this.editedItem[column]['items'] = []
                            
                            this.defaultItem[column] = {}
                            this.defaultItem[column]['items'] = []
    
                            if (relation == 'One-to-One') {
                                this.editedItem[column]['value'] = initVal
                                this.defaultItem[column]['value'] = initVal
                            } else if (relation == 'One-to-Many' || relation == 'Many-to-Many') {
                                this.editedItem[column]['values'] = []
                                this.defaultItem[column]['values'] = []
                            }
                            
                            foreignVals.data.data.forEach(item => {
                                this.editedItem[column]['items'].push(item[this.selectFields[column].label])
                                this.defaultItem[column]['items'].push(item[this.selectFields[column].label])
                            })
                        } else {
                            this.editedDetail[column] = {}
                            this.editedDetail[column]['items'] = []
                            
                            this.defaultDetail[column] = {}
                            this.defaultDetail[column]['items'] = []
    
                            if (relation == 'One-to-One') {
                                this.editedDetail[column]['value'] = initVal
                                this.defaultDetail[column]['value'] = initVal
                            } else if (relation == 'One-to-Many') {
                                this.editedDetail[column]['values'] = []
                                this.defaultDetail[column]['values'] = []
                            }
                            
                            foreignVals.data.data.forEach(item => {
                                this.editedDetail[column]['items'].push(item[this.detailSelectFields[column].label])
                                this.defaultDetail[column]['items'].push(item[this.detailSelectFields[column].label])
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

                            this.menuPickers[column] = false
                        } else {
                            this.editedDetail[column] = {}
                            this.editedDetail[column].date = initVal.substr(0, 10)
                            this.editedDetail[column].time = initVal.substr(11, 19)
    
                            this.defaultDetail[column] = {}
                            this.defaultDetail[column].date = initVal.substr(0, 10)
                            this.defaultDetail[column].time = initVal.substr(11, 19)

                            this.detailMenuPickers[column] = false
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

            if (this.model == 'user') {
                this.passFields.pass = ''
                this.passFields.confirmPass = ''
            }
            
            list.push({ text: 'Actions', value: 'actions', sortable: false })

            if (!detail) {
                this.headers = list
                this.formHeaders = formList
            } else {
                this.detailHeaders = list
                this.detailFormHeaders = formList
            }
            
            this.manyHeaders = this.manyHeaders.concat(manyToManyList)
            list = []

            let oneToManyFields = []
            let compareFields = []

            for (let field in schema) {
                if (schema[field].relation && schema[field].relation == 'One-to-Many') oneToManyFields.push(schema[field].alias)
            }
            
            if (oneToManyFields.length) {
                for (let field in schema) {
                    if (oneToManyFields.indexOf(field) == -1) compareFields.push(field)
                }
            }
            
            if (toList) {
                if (!detail) {
                    this.desserts = []
                } else {
                    this.detailDesserts = []
                }

                if (data.length) {
                    let count = 0

                    for (let row of data) {
                        count = 0

                        if (oneToManyFields.length) {
                            for (let obj of list) {
                                for (let field of compareFields) {
                                    if (obj[field] == row[field]) count ++
                                }
                            }
                        }

                        if (count == 0 || count < compareFields.length) {
                            for (let attr in row) {
                                if (!detail) {
                                    for (let field in this.selectFields) {
                                        if (this.selectFields[field].relation == 'One-to-One' && this.selectFields[field].alias == attr) {
                                            if (row[attr]) {
                                                row[attr] = row[attr][this.selectFields[field].label]
                                            } else {
                                                row[attr] = '-'
                                            }
                                        }
                                    }
                                } else {
                                    for (let field in this.detailSelectFields) {
                                        if (this.detailSelectFields[field].relation == 'One-to-One' && this.detailSelectFields[field].alias == attr) {
                                            if (row[attr]) {
                                                row[attr] = row[attr][this.detailSelectFields[field].label]
                                            } else {
                                                row[attr] = '-'
                                            }
                                        }
                                    }
                                }
                                
                                if (schema[attr] && schema[attr].type == 'DATE') row[attr] = row[attr].substr(0, 19)
                                if (schema[attr] && schema[attr].type == 'DATEONLY') row[attr] = row[attr].substr(0, 10)
                            }
                            
                            list.push(row)
                        }
                        
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
            await this.$store.dispatch('verifyToken')

            this.showPassFields = false
            let oneToManyFields = ''
            let record = {}
            
            for (let attr in item) {
                for (let field in this.selectFields) {
                    if (this.selectFields[field].alias == attr && this.selectFields[field].relation == 'One-to-One') {
                        record[field] = {}
                        record[field].items = this.editedItem[field].items
                        record[field].value = item[attr]
                    }
                }

                if (this.editedItem[attr] && this.editedItem[attr].date) {
                    record[attr] = {}
                    record[attr].date = item[attr].substr(0, 10)
                    record[attr].time = item[attr].substr(11, 19)
                } else if (!item[attr].id) {
                    record[attr] = item[attr]
                }
            }
            
            for (let field in this.selectFields) {
                let obj = this.selectFields[field]

                if (obj.relation == 'One-to-Many') {
                    oneToManyFields += \`\${field}=\${obj.values[0].id}\`

                    if (obj.values.length > 1) {
                        for (let i=1; i<obj.values.length; i++) oneToManyFields += \`&\${field}=\${obj.values[i].id}\`
                    }
                }
            }
            
            if (oneToManyFields) {
                let res = await axios({
                    method: 'GET',
                    baseURL: \`http://localhost:8300/\${this.model}/list?\${oneToManyFields}&updatedAt[order]=desc\`,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                })
                
                let data = res.data.data
                let schema = res.data.schema

                for (let field in this.selectFields) {
                    if (this.selectFields[field].relation == 'One-to-Many') {
                        record[field] = {}
                        record[field].items = this.editedItem[field].items
                        record[field].values = []
                    }
                }
                
                for (let obj of data) {
                    for (let field in this.selectFields) {
                        if (this.selectFields[field].relation == 'One-to-Many') {
                            record[field].values.push(obj[schema[field].alias][this.selectFields[field].label])
                        }
                    }
                }
            }
            
            if (this.manyToManyModel) {
                for (let field in this.selectFields) {
                    if (this.selectFields[field].relation == 'Many-to-Many') {
                        record[field] = {}
                        record[field].items = this.editedItem[field].items
                        record[field].values = this.editedItem[field].values
                    }
                }
                
                let res = await axios({
                    method: 'GET',
                    baseURL: \`http://localhost:8300/\${this.manyToManyModel}/list?\${this.model}=\${item.id}&updatedAt[order]=desc\`,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                })
                
                for (let obj of res.data.data) {
                    for (let field in this.selectFields) {
                        if (field == this.model || (this.selectFields[field].relation == 'Many-to-Many')) {
                            for (let val of this.selectFields[field].values) {
                                let value = val[this.selectFields[field].label]
                                if (val.id == obj[field] && record[field].values.indexOf(value) == -1) record[field].values.push(value)
                            }
                        }
                    }
                }
            }
            
            if (this.compound) {
                let res = await axios({
                    method: 'GET',
                    baseURL: \`http://localhost:8300/\${this.model}/list?\${this.headerModel.fieldName}=\${item.id}&updatedAt[order]=desc\`,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                })
                let data = res.data.data
                let schema = res.data.schema
                for (let obj of data) delete obj[schema[this.headerModel.fieldName].alias]
                delete schema[this.headerModel.fieldName]
                this.dataBuilding(data, schema, true, true)
            }
            
            this.editedIndex = this.desserts.indexOf(item)
            this.editedItem = Object.assign({}, record)
            
            this.headerButton = false
            this.detailButton = false
            this.dialog = true
        },
        editDetail (item) {
            let record = {...item}
            
            for (let attr in record) {
                for (let field in this.detailSelectFields) {
                    if (this.detailSelectFields[field].alias == attr) {
                        record[field] = {}
                        record[field].items = this.editedDetail[field].items
                        record[field].value = item[attr]
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
                this.deleteMessage = \`Deleting this \${this.title} will also delete its \${this.title} detail.
Are you sure?\`
            } else {
                this.deleteMessage = \`Are you sure you want to delete this \${this.title}?\`
            }

            this.editedIndex = this.desserts.indexOf(item)
            this.deletedItem = Object.assign({}, item)
            this.dialogDelete = true
        },
        deleteDetail (item) {
            this.detailIndex = this.detailDesserts.indexOf(item)
            this.detailDialogDelete = true
        },
        async deleteItemConfirm () {
            await this.$store.dispatch('verifyToken')

            let body = {}

            if (this.compound) {
                body.id = this.deletedItem.id
                body.foreignKey = this.headerModel.fieldName

                axios({
                    method: 'DELETE',
                    baseURL: \`http://localhost:8300/\${this.model}/delete\`,
                    data: body,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                })
                .then(() => {
                    delete body.foreignKey

                    axios({
                        method: 'DELETE',
                        baseURL: \`http://localhost:8300/\${this.headerModel.modelName}/delete\`,
                        data: body,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                    })
                    .then(() => {
                        this.getData()
                        this.closeDelete()
                    })
                    .catch(err => alert(err))
                })
                .catch(err => alert(err))
            } else {
                body.id = this.deletedItem.id
                axios({
                    method: 'DELETE',
                    baseURL: \`http://localhost:8300/\${this.model}/delete\`,
                    data: body,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
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

                if (this.model == 'user') {
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
        compoundBodyBuilding() {
            let { id: this.editedItem.id, records: [] }
            let obj = {}
            let row = {}
            
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
                } else {
                    obj[attr] = this.editedItem[attr]
                }
            }
            
            for (let item of this.detailDesserts) {
                row = { ...item }
                
                for (let attr in item) {
                    for (let field in this.detailSelectFields) {
                        if (this.detailSelectFields[field].alias == attr) {
                            for (let val of this.detailSelectFields[field].values) {
                                if (item[attr] == val[this.detailSelectFields[field].label]) {
                                    row[field] = val.id
                                    delete row[attr]
                                }
                            }
                        }
                    }
                }
                
                for (let element of this.desserts) {
                    if (element.id == obj.id) {
                        row[this.headerModel.fieldName] = element.id
                        break
                    }
                }
                
                body.records.push(row)
            }

            return body
        },
        oneToManyBodyBuilding() {
            let body = { records: [] }
            let obj = {}
            
            for (let attr in this.editedItem) {
                if (!this.editedItem[attr].values) {
                    if (this.editedItem[attr].value) {
                        for (let val of this.selectFields[attr].values) {
                            if (this.editedItem[attr].value == val[this.selectFields[attr].label]) {
                                obj[attr] = val.id
                            }
                        }
                    } else if (this.editedItem[attr].date) {
                        obj[attr] = \`\${this.editedItem[attr].date} \${this.editedItem[attr].time}\`
                    } else {
                        obj[attr] = this.editedItem[attr]
                    }
                }
            }

            for (let attr in this.editedItem) {
                if (this.editedItem[attr].values) {
                    for (let value of this.editedItem[attr].values) {
                        for (let val of this.selectFields[attr].values) {
                            if (value == val[this.selectFields[attr].label]) {
                                body.records.push({ ...obj, [attr]: val.id })
                            }
                        }
                    }
                }
            }

            return body
        },
        manyToManyBodyBuilding() {
            let body = { records: [] }
            let obj = {}

            for (let attr in this.editedItem) {
                if (attr == this.model) {
                    for (let value of this.editedItem[attr].values) {
                        for (let val of this.selectFields[attr].values) {
                            if (value == val[this.selectFields[attr].label]) {
                                obj[attr] = val.id

                                for (let col in this.editedItem) {
                                    if (col != this.model && this.selectFields[col] && this.selectFields[col].relation == 'Many-to-Many') {
                                        for (let value of this.editedItem[col].values) {
                                            for (let val of this.selectFields[col].values) {
                                                if (value == val[this.selectFields[col].label]) {
                                                    body.records.push({ ...obj, [col]: val.id })
                                                }
                                            }
                                        }
                                    }
                                }
                                
                            }
                        }
                    }
                }
            }
            
            if (!body.records.length) {
                for (let field in this.selectFields) {
                    if (field == this.model) {
                        for (let value of this.selectFields[field].values) {
                            if (value[this.selectFields[field].label] == this.editedItem[this.selectFields[field].label]) {
                                body = { id: value.id, model: field }
                            }
                        }
                    }
                }
            }
            
            return body
        },
        singleBodyBuilding() {
            let body = {}

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

            if (this.showPassFields && this.model == 'user') {
                if (this.passFields.pass.trim() === this.passFields.confirmPass.trim()) {
                    body.password = this.passFields.pass.trim()
                } else {
                    this.errors = 'Passwords do not match, please check them.'
                }
            }

            return body
        },
        async save () {
            await this.$store.dispatch('verifyToken')

            let body = {}
            let table = this.manyToManyModel ? this.manyToManyModel : this.model
            
            for (let attr in this.editedItem) {
                if (this.editedItem[attr].values) {
                    body.records = []
                    break
                }
            }

            if (this.compound) body.records = []
            
            if (body.records) {
                if (this.compound) {
                    body = this.compoundBodyBuilding()
                } else if (this.manyToManyModel) {
                    body = this.manyToManyBodyBuilding()
                } else {
                    body = this.oneToManyBodyBuilding()
                }
            } else {
                body = this.singleBodyBuilding()
            }
            
            if (this.editedIndex > -1) {
                axios({
                    method: 'PUT',
                    baseURL: \`http://localhost:8300/\${table}/update\`,
                    data: body,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                })
                .then(() => this.getData())
                .catch(err => alert(err))
            } else {
                if (!this.errors) {
                    if (body.id) delete body.id
                    
                    axios({
                        method: 'POST',
                        baseURL: \`http://localhost:8300/\${table}/add\`,
                        data: body,
                        headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                    })
                    .then(() => this.getData())
                    .catch(err => alert(err))

                    this.errors = null
                } else {
                    alert(this.errors)
                }
            }
            
            if (!this.errors) this.close()
        },
        async saveHeader() {
            await this.$store.dispatch('verifyToken')
            
            let body = {}
            let method = 'post'
            let urlMethod = 'add'

            for (let attr in this.editedItem) {
                if (this.editedItem[attr].values) {
                    body.records = []
                    break
                }
            }

            if (body.records) {
                body = this.oneToManyBodyBuilding()
            } else {
                body = this.singleBodyBuilding()
            }

            if (this.editedIndex > -1) {
                method = 'put'
                urlMethod = 'update'
            }
            
            axios({
                method,
                baseURL: \`http://localhost:8300/\${this.headerModel.modelName}/\${urlMethod}\`,
                data: body,
                headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
            })
            .then(async () => {
                let res = await axios({
                    method: 'GET',
                    baseURL: \`http://localhost:8300/\${this.headerModel.modelName}/list?updatedAt[order]=desc\`,
                    data: body,
                    headers: { 'Authorization': \`Bearer \${this.$store.state.accessToken}\` }
                })
                let data = res.data.data
                let schema = res.data.schema
                let list = []
                if (this.compound && this.editedIndex == -1) this.headerModel.newId = data[0].id

                for (let column in schema) {
                    if (schema[column].relation && schema[column].relation == 'Many-to-Many') {
                        this.selectFields[this.headerModel.fieldName].values = data
                        this.editedItem[this.headerModel.fieldName].items = []
                        this.defaultItem[this.headerModel.fieldName].items = []
                        
                        data.forEach(item => {
                            this.editedItem[this.headerModel.fieldName]['items'].push(item[this.selectFields[this.headerModel.fieldName].label])
                            this.defaultItem[this.headerModel.fieldName]['items'].push(item[this.selectFields[this.headerModel.fieldName].label])
                        })
                    }
                }
                
                for (let row of data) {
                    for (let attr in row) {
                        for (let field in this.selectFields) {
                            if (this.selectFields[field].alias == attr) row[attr] = row[attr][this.selectFields[field].label]
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
                    if (this.editedIndex == -1) obj[this.headerModel.fieldName] = this.headerModel.newId
                }
            }

            if (row.records) {
                for (let attr in this.editedDetail) {
                    if (this.editedDetail[attr].items) {
                        for (let value of this.editedDetail[attr].values) {
                            for (let val of this.detailSelectFields[attr].values) {
                                if (value == val[this.detailSelectFields[attr].label]) {
                                    row.records.push({ ...obj, [this.detailSelectFields[attr].alias]: val[this.detailSelectFields[attr].label] })
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
                    if (this.editedIndex == -1) row[this.headerModel.fieldName] = this.headerModel.newId

                    if (this.editedDetail[attr].items) {
                        for (let val of this.detailSelectFields[attr].values) {
                            if (this.editedDetail[attr].value == val[this.detailSelectFields[attr].label]) {
                                row[this.detailSelectFields[attr].alias] = val[this.detailSelectFields[attr].label]
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
                Object.assign(this.detailDesserts[this.detailIndex], row)
            } else {
                if (row.records) {
                    for (let i=0; i<row.records.length; i++) {
                        this.detailDesserts.push(row.records[i])
                    }
                } else {
                    this.detailDesserts.push(row)
                }
            }

            this.closeDetail()
        }
    },
    computed: {
        formTitle() {
            if (this.editedIndex === -1) {
                return \`New \${this.title}\`
            } else {
                return \`Edit \${this.title}\`;
            }
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