function content(models, auth) {
    let amountInterfaces = 0
    let count = 0

    Object.keys(models).forEach(obj => {
        if (models[obj].interface) amountInterfaces++
    })

    let template = `import Vue from 'vue'
import Vuex from 'vuex'\n`

    if (auth) {
        template += `import VueJwtDecode from 'vue-jwt-decode'
import Router from '../router/index'
import axios from 'axios'\n`
    }
    
    template += `\nVue.use(Vuex)
    
export default new Vuex.Store({
    state: {\n`

    if (auth) {
        template += `\t\tpermissions: [],
        currentOptions: {},
        allOptions: ${JSON.stringify(models.interfaces, null, 4)},
        accessToken: localStorage.getItem('token') || '',
        refreshToken: localStorage.getItem('refreshToken') || ''
    },
    mutations: {
        setPermissions(state, list) {
            state.permissions = list
        },
        setCurrentOptions(state, options) {
            state.currentOptions = options
        },
        setAccessToken(state, token) {
            state.accessToken = token
            localStorage.setItem('token', token)
        },
        setRefreshToken(state, token) {
            state.refreshToken = token
            localStorage.setItem('refreshToken', token)
        }
    },
    actions: {
        async verifyToken({state, commit}) {
            let res = { state: true, message: '' }
    
            if (state.accessToken) {
                const payload = VueJwtDecode.decode(state.accessToken)
            
                if (payload.exp * 1000 < new Date().getTime()) {
                    try {
                        const response = await axios({
                            method: 'POST',
                            baseURL: \`http://localhost:8300/auth/refresh\`,
                            data: { refreshToken: state.refreshToken }
                        })
                        
                        commit('setAccessToken', response.data.token)
                    } catch (err) {
                        if (err.response.status == 401) {
                            res.state = false
                            res.message = \`Verify token: Unauthorized user, please login.\`
                        } else {
                            res.state = false
                            res.message = \`Verify token: \${err.response.data.message}\`
                        }
                    }
                }
            } else {
                res.state = false
                res.message = \`Verify token: Can't get access token.\`
            }
            
            return res
        },
        logOut({commit}) {
            commit('setAccessToken', '')
            commit('setRefreshToken', '')
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            Router.history.push('/login')
        },
        setOption(currentOption) {
            let exist = false
      
            for (let item in Object.keys(this.state.currentOptions)) {
                if (this.state.currentOptions[item].type == 'group') {
                    for (let option of this.state.currentOptions[item].options) {
                        if (option == currentOption) exist = true
                    }
                } else {
                    if (item == currentOption) exist = true
                }
            }
      
            if (!exist) return true
            return false
          },
        async verifyPermissions({state, dispatch, commit}) {
            let permissions = state.permissions
            let allOptions = state.allOptions
            let payload = null
            let options = {}
    
            if (state.accessToken) {
                payload = VueJwtDecode.decode(state.accessToken)
            }
            
            if (payload && payload.roleName === 'master') {
                options = state.allOptions
            } else if (permissions.length) {
                for (let permission of permissions) {
                    for (let item in Object.keys(allOptions)) {
                        if (allOptions[item].type == 'group') {
                            for (let option of allOptions[item].options) {
                                if (permission.path.indexOf(\`/\${option.path}\`) > -1) {
                                    if (await dispatch('setOption', option)) options[item] = allOptions[item]
                                }
                            }
                        } else {
                            if (permission.path.indexOf(\`/\${allOptions[item].path}\`) > -1) {
                                if (await dispatch('setOption', item)) options[item] = allOptions[item]
                            }
                        }
                    }
                }
            }
            commit('setCurrentOptions', options)
        }
    },\n`

    } else {
        template += `\t\tcurrentOptions: ${JSON.stringify(models.interfaces, null, 2)},
    },
    mutations: {
    },
    actions: {
    },
    modules: {
    }\n`
    }
        
    template += '})'

  return template
}

module.exports = content