/**
 * @typedef {Object} State
 * @property {import('../../services/cluster')} cluster
 */

/** @type {import('koa').Middleware<State>} */
module.exports = async context => {
  const { cluster, user } = context.state
  const params = context.params
  params.userName = user.userName
  const ret = await cluster.listUser()
  context.body = ret
}
