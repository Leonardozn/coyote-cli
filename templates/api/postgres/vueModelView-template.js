function content(model) {
    const template = `<template>
  <div class="model">
    <DataTable model="${model}"/>
  </div>
</template>

<script>
// @ is an alias to /src
import DataTable from '@/components/DataTable.vue'

export default {
  components: {
    DataTable
  }
}
</script>`

  return template
}

module.exports = content