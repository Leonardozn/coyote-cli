function content(models, auth) {
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

      <v-list
        dense
        nav
      >
        <v-list-item
          v-for="item in items"
          :key="item.title"
          :to="item.path"
          @click="navigation(item.title)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          
          <v-list-item-content>
            <v-list-item-title>{{item.title.charAt(0).toUpperCase() + item.title.slice(1)}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn @click="logout" block>
            Logout
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar ${auth ? `v-if="menuOption != 'login'"` : ''} app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>{{menuOption.charAt(0).toUpperCase() + menuOption.slice(1)}}</v-toolbar-title>
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
        const currentPath = this.$router.currentRoute.path.split('/')
        this.menuOption = currentPath[1] ? currentPath[1] : 'login'
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