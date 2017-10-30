const Handler = require('./handler')
const tags = ['api', 'metadata']

module.exports = [
  {
    method: 'GET',
    path: '/health',
    handler: Handler.health,
    config: {
      tags: tags,
      description: 'Status of directory',
      id: 'health'
    }
  },
  {
    method: 'GET',
    path: '/',
    handler: Handler.metadata,
    config: {
      tags: tags,
      description: 'Metadata'
    }
  }
]
