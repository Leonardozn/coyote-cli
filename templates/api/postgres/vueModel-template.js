const utils = require('../../../controllers/utils')

function content(model, models) {
  let template = `<template>
  <div>
    <v-data-table
    :headers="headers"
    :items="desserts"
    :search="search"
    class="elevation-1"
    >
      <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>{{ \`${model.capitalize()} list\` }}</v-toolbar-title>
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
            
            <v-btn color="primary" dark class="mb-2" @click="dialog=true">{{ \`New ${model}\` }}</v-btn>
          </v-toolbar>
      </template>

      <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
          <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
    </v-data-table>

    <!-- MAIN DIALOG -->
    <v-form ref="editedItem">
      <v-dialog v-model="dialog" max-width="800px" persistent>
        <v-card>
          <v-card-title>
            <span class="text-h5">{{ formTitle }}</span>
          </v-card-title>

          <v-card-text>
            <v-container>
              <v-row>\n`

  for (let field of models[model].field) {
    template += `\t\t\t\t\t\t\t\t`
  }
                  
  template += `\t\t\t\t\t\t\t</v-row>
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
        <v-card-title class="text-h5">{{ deleteMessage }}</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>

          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>`

  return template
}

module.exports = content