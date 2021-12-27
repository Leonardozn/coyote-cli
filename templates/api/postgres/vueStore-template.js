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

    
    template += `\t\tmenuOption: null`

    if (auth) {
        template += `\t\tpermissions: [],
        currentOptions: {},
        allOptions: ${JSON.stringify(models.interfaces, null, 4)},
        accessToken: localStorage.getItem('token') || '',
        refreshToken: localStorage.getItem('refreshToken') || ''\n`
    } else {
        template += `currentOptions: ${JSON.stringify(models.interfaces, null, 4)}\n`
    }
        
    template += `\t},
    mutations: {
        setMenuOption(state, title) {
            state.menuOption = title
        },\n`

    if (auth) {
        template += `\t\tsetPermissions(state, list) {
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
        }`
    }
        
    template += `\t},
    actions: {
        getTitle({state, commit}) {
            const currentPath = Router.currentRoute.path.split("/");
            const path = currentPath[1] ? currentPath[1] : "home";
            const options = { ...state.currentOptions }
        
            for (let option in options) {
                if (options[option].type == 'single' && path == options[option].path) {
                    commit('setMenuOption', options[option].title)
                    break
                }
        
                if (options[option].type == 'group') {
                    for (let subOption of options[option].options) {
                        if (subOption.path == path) {
                            commit('setMenuOption', subOption.title)
                            break
                        }
                    }
                }
            }
        },\n`

        if (auth) {
            template += `\t\tasync verifyToken({state, commit}) {
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
                            if (err.response && err.response.status == 401) {
                                res.state = false
                                res.message = \`Verify token: Unauthorized user, please login.\`
                            } else {
                                res.state = false
                                res.message = \`Verify token: \${ err.response ? err.response.data.message : 'No server response'}\`
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
                commit('setMenuOption', null)
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
        }
        
    
    template += `\t\tmodules: {
    }\n`
        
    template += '})'

  return template
}

module.exports = content