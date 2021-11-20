function content(auth) {
    let template = `<template>
  <v-app id="inspire">
    <v-navigation-drawer
      ${auth ? `v-if="menuOption != 'login'"` : ''}
      v-model="drawer"
      app
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Itech
          </v-list-item-title>
          <v-list-item-subtitle>
            Vuetify Test
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item-group>
          <div v-for="item in Object.keys(items)" :key="item">
            <v-list-group
              v-if="items[item].type == 'group'"
              :prepend-icon="items[item].icon"
              no-action
            >
              <template v-slot:activator>
                <v-list-item-title>{{items[item].title}}</v-list-item-title>
              </template>

              <v-list-item
                v-for="option in items[item].options"
                :key="option.title"
                :to="option.path"
                @click="navigation(option.path)"
              > 
                <v-list-item-content>
                  <v-list-item-title>{{option.title.charAt(0).toUpperCase() + option.title.slice(1)}}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-group>

            <v-list-item
              v-if="items[item].type == 'single'"
              :key="items[item].title"
              :to="items[item].path"
              @click="navigation(items[item].path)"
            >
              <v-list-item-icon v-if="items[item].icon">
                <v-icon>{{ items[item].icon }}</v-icon>
              </v-list-item-icon>
              
              <v-list-item-content>
                <v-list-item-title>{{items[item].title.charAt(0).toUpperCase() + items[item].title.slice(1)}}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </div>
        </v-list-item-group>
      </v-list>`

    if (auth) {
      template += `\n\t\t\t<template v-slot:append>
        <div class="pa-2">
          <v-btn @click="logout" block>
            Logout
          </v-btn>
        </div>
      </template>`
    }
    

    template += `\n\t\t</v-navigation-drawer>

    <v-app-bar ${auth ? `v-if="menuOption != 'login'"` : 'home'} app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>{{menuOption}}</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>
  
<script>
  export default {
    data() { 
      return {
        drawer: null,
        items: [],
        menuOption: null
      }
    },
    methods: {
      navigation(option) { this.menuOption = option },
      getCurrentOption() {
        this.$store.dispatch('getTitle')
        this.menuOption = this.$store.state.menuOption
        this.items = this.$store.state.currentOptions
      }${auth ? ",\n\t\t\tlogout() { this.$store.dispatch('logOut') }" : ''}
    },
    beforeMount() {
      this.getCurrentOption()
    },
    updated() {
      this.getCurrentOption()
    }
  }
</script>
  
<style scoped>
  a {
    text-decoration: none;
  }

  .link-name {
    font-size: 15px;
    color: black;
  }
</style>`

  return template
}

module.exports = content