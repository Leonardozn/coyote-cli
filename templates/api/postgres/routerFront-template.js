function content(models) {
    let template = `import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'\n`
    
    Object.keys(models).forEach(obj => {
        if (models[obj].interface) {
            template += `import ${models[obj].interface.componentName} from '../views/${models[obj].interface.componentName}.vue'\n`
        }
    })
    
    template += `\nVue.use(VueRouter)
    
const routes = [
    { path: '/home', name: 'Home', component: Home },\n`

    Object.keys(models).forEach((obj, i) => {
        if (models[obj].interface) {
            template += `\t{ path: '/${obj}', name: '${models[obj].interface.componentName}', component: ${models[obj].interface.componentName} }`
    
            if (i < Object.keys(models).length - 1) {
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
})

export default router`

    return template
}

module.exports = content