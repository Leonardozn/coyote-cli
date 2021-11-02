function content(models, auth) {
    let template = `import Vue from 'vue'
import VueRouter from 'vue-router'\n`

    if (auth) {
        template += `import Login from '../views/Login.vue'
import VueJwtDecode from 'vue-jwt-decode'
import axios from 'axios'
import Store from '../store/index'\n`
    }
    
    Object.keys(models.interfaces).forEach(model => {
        if (models.interfaces[model].type == 'group') {
            for (let option of models.interfaces[model].options) template += `import ${option.componentName} from '../views/${option.componentName}.vue'\n`
        } else {
            template += `import ${models.interfaces[model].componentName} from '../views/${models.interfaces[model].componentName}.vue'\n`
        }
    })
    
    template += `\nVue.use(VueRouter)
    
const routes = [
    ${auth ? "{ path: '/login', name: 'Login', component: Login },\n" : ''}`

    Object.keys(models.interfaces).forEach((model, i) => {
        if (models.interfaces[model].type == 'group') {
            models.interfaces[model].options.forEach((option, j) => {
                template += `\t{ path: '/${option.path}', name: '${option.componentName}', component: ${option.componentName} }`

                if (i < Object.keys(models.interfaces).length - 1) {
                    template += ',\n'
                } else {
                    if (j < models.interfaces[model].options.length - 1) {
                        template += ',\n'
                    } else {
                        template += '\n'
                    }
                }
            })
        } else {
            template += `\t{ path: '/${models.interfaces[model].path}', name: '${models.interfaces[model].componentName}', component: ${models.interfaces[model].componentName} }`
            
            if (i < Object.keys(models.interfaces).length - 1) {
                template += ',\n'
            } else {
                template += '\n'
            }
        }

        
    })
    
    template += `]
    
const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})\n`

    if (auth) {
        template += `\nrouter.beforeEach(async (to, from, next) => {
    let payload = null
    let permissions = []
    let permission = false
    let requestError = null
    
    const res = await Store.dispatch('verifyToken')
    
    if (Store.state.accessToken) {
        payload = VueJwtDecode.decode(Store.state.accessToken)
    
        if (Store.state.permissions.length) {
            permissions = Store.state.permissions
        } else {
            const response = await axios({
                method: 'GET',
                baseURL: \`http://localhost:8300/permissions/list?role=\${payload.role}\`,
                headers: { 'Authorization': \`Bearer \${Store.state.accessToken}\`, navigation: true }
            })
            .then(obj => obj)
            .catch(err => requestError = err)
            
            if (!requestError) {
                permissions = response.data.data
                Store.commit('setPermissions', permissions)
                await Store.dispatch('verifyPermissions')
            }
        }
    }
    
    if (to.name !== 'Login') {
        if (res.state) {
            for (let item of permissions) {
                if (to.path.indexOf(item.path) > -1) permission = true
            }
            
            if (permission) {
                next()
            } else {
                if (requestError) {
                    alert(\`Permissions of navigation: \${requestError.response.data.message}\`)
                } else {
                    alert('Permissions of navigation: This user has no permissions to this option.')
                }
        
                router.history.push(router.history[router.history.length-1])
            }
        } else {
            alert(res.message)
            Store.dispatch('logOut')
        }
    } else {
        if (res.state) {
            router.history.push('/home')
        } else {
            next()
        }
    }
})`
    }

    template += `\n\nexport default router`

    return template
}

module.exports = content