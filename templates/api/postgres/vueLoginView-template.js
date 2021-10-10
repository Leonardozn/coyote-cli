function content() {
    let template = `<template>
    <div class="model">
        <Login/>
    </div>
</template>
  
<script>
import Login from '@/components/Login.vue'

export default {
    components: {
        Login
    }
}
</script>`

  return template
}

module.exports = content