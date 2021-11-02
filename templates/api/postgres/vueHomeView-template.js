function content() {
    const template = `<template>
  <div class="model">
    <Home />
  </div>
</template>

<script>
// @ is an alias to /src
import Home from '@/components/Home.vue'

export default {
  components: {
    Home
  }
}
</script>`

  return template
}

module.exports = content