const config = require('config')
const administrators = config.get('administrators')
const userGroup = config.get('userGroup')

/**
 * @typedef {Object} State
 * @property {import('../services/user')} user
 */

/** @type {import('koa').Middleware<State>} */
module.exports = (context) => {
  let { user } = context.state
  context.type = 'js'
  context.body = `bootstrap(${JSON.stringify({
    ...user,
    administrators,
    userGroupPath: userGroup.frontEndPath,
    i18n: config.get('i18n')
  })})`
}
