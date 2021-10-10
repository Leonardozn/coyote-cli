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
        currentOptions: [],
        allOptions: [
            { title: 'Home', path: 'home', icon: 'mdi-view-dashboard' },\n`
        
            Object.keys(models).forEach(obj => {
                if (models[obj].interface) {
                    count++
                    template += `\t\t\t{ title: '${models[obj].interface.title}', path: '${obj}', icon: 'mdi-view-dashboard' }`
                }

                if (models[obj].interface && count < amountInterfaces) template += ',\n'
            })

        template += '\n\t\t],\n'

        template += `\t\taccessToken: localStorage.getItem('token') || '',
        refreshToken: localStorage.getItem('refreshToken') || ''
    },
    mutations: {
        setPermissions(state, list) {
            state.permissions = list
        },
        setCurrentOptions(state, list) {
            state.currentOptions = list
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
        setOption(option) {
            let exist = false
            for (let item of this.state.currentOptions) {
                if (JSON.stringify(item) == JSON.stringify(option)) exist = true
            }
    
            if (!exist) return true
            return false
        },
        async verifyPermissions({state, dispatch, commit}) {
            let permissions = state.permissions
            let allOptions = state.allOptions
            let payload = null
            let items = []
    
            if (state.accessToken) {
                payload = VueJwtDecode.decode(state.accessToken)
            }
            
            if (payload && payload.roleName === 'master') {
                items = state.allOptions
            } else if (permissions.length) {
                for (let permission of permissions) {
                    for (let option of allOptions) {
                        if (permission.path.indexOf(\`/\${option.path}\`) > -1) {
                            if (await dispatch('setOption', option)) items.push(option)
                        }
                    }
                }
            }
            commit('setCurrentOptions', items)
        }
    },\n`

    } else {
        template += `\t\tcurrentOptions: [
            { title: 'Home', path: 'home', icon: 'mdi-view-dashboard' },\n`
        
        count = 0
        Object.keys(models).forEach(obj => {
            if (models[obj].interface) {
                count++
                template += `\t\t\t{ title: '${models[obj].interface.title}', path: '${obj}', icon: 'mdi-view-dashboard' }`
            }

            if (models[obj].interface && count < amountInterfaces) template += ',\n'
        })

        template += `\n\t\t],
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