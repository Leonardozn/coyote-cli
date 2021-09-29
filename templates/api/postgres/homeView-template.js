function content() {
    const template = `<template>
    <Home />
  </template>
  
  <script>
  import Home from '@/components/Home.vue'
  
  export default {
    name: 'Home',
    components: {
      Home
    }
  }
  </script>`

  return template
}

module.exports = content