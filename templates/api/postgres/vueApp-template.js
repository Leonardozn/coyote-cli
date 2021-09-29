function content(models) {
    let template = `<template>
  <v-app id="inspire">
    <v-navigation-drawer
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
          :to="item.path == 'home' ? '/' : item.path"
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
    </v-navigation-drawer>

    <v-app-bar app>
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
        items: [
          { title: 'Home', path: '/home', icon: 'mdi-view-dashboard' },\n`
  
  Object.keys(models).forEach((obj, i) => {
      if (models[obj].interface) {
        template += `\t\t\t\t\t{ title: '${models[obj].interface.title}', path: '${obj}', icon: 'mdi-view-dashboard' }`
  
        if (i < Object.keys(models).length - 1) {
            template += ',\n'
        } else {
            template += '\n'
        }
      }
  })
  
  template += `\t\t\t\t],
        menuOption: 'home'
      }
    },
    methods: {
        navigation(option) { this.menuOption = option }
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