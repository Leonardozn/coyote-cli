const dependencies = [
  {
    name: 'node',
    dependencies: {
      nvm: 'lts'
    },
    settings: {
      nvm: true
    }
  },
  {
    name: 'mongo'
  },
  {
    name: 'express',
    dependencies: {
      morgan: 'lts',
      cors: 'lts',
      dotenv: 'lts'
    },
    settings: {
      morgan: true,
      cors: true,
      dotenv: true
    },
    pluginDependencies: {
      node : 'lts'
    }
  },
  {
    name: 'mongo-model',
    dependencies: {
      joi: 'lts'
    },
    pluginDependencies: {
        node : 'lts',
        mongo: 'lts'
    },
    settings: {
        models: {}
    }
  }
]

module.exports = dependencies