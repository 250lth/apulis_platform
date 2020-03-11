const Ajv = require('ajv')

const validator = new Ajv()
validator.addSchema(require('./signin.schema'), 'signIn')
validator.addSchema(require('./signup.schema'), 'signUp')
validator.addSchema(require('./addUser.schema'), 'addUser')

module.exports = validator
