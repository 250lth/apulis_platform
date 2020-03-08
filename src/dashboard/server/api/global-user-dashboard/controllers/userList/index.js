const config = require('config')
const Cluster = require('../../service/cluster')

const clusterIds = Object.keys(config.get('clusters'))
module.exports = async context => {
  const clusterId = clusterIds[0]
  const response = await new Cluster(context, clusterId).fetch('/GetAllUsers')
  context.assert(response.ok, 502)
  const data = await response.json()
  context.body = data
}
