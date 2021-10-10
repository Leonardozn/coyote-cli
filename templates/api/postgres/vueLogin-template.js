function content() {
    let template = `<template>
   <v-app id="inspire">
      <v-main>
         <v-container fluid fill-height>
            <v-layout align-center justify-center>
               <v-flex xs12 sm8 md4>
                  <v-card class="elevation-12">
                     <v-toolbar dark color="primary">
                        <v-toolbar-title>Login form</v-toolbar-title>
                     </v-toolbar>
                     <v-card-text>
                        <v-form>
                           <v-text-field
                              prepend-icon="mdi-account"
                              name="login"
                              label="Username or E-mail"
                              type="text"
                              v-model="username"
                           ></v-text-field>
                           <v-text-field
                              id="password"
                              prepend-icon="mdi-lock"
                              name="password"
                              label="Password"
                              type="password"
                              v-model="password"
                           ></v-text-field>
                        </v-form>
                     </v-card-text>
                     <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" @click="login">Login</v-btn>
                     </v-card-actions>
                  </v-card>
               </v-flex>
            </v-layout>
         </v-container>
      </v-main>
   </v-app>
</template>
 
<script>
import axios from 'axios'

export default {
   name: 'Login',
   data() {
      return {
         username: '',
         password: ''
      }
   },
   props: {
      source: String,
   },
   methods: {
      login() {
         const body = { username: this.username, password: this.password }
         axios.post(\`http://localhost:8300/auth/login\`, body)
         .then(res => {
            this.$store.commit('setAccessToken', res.data.token)
            this.$store.commit('setRefreshToken', res.data.refreshToken)
            this.$store.commit('setPermissions', [])
            this.$store.commit('setCurrentOptions', [])
            this.$router.history.push('/home')
         })
         .catch(err => alert(err))
      }
   }
};
</script>`

  return template
}

module.exports = content