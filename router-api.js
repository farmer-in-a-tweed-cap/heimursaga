const express = require('express')
const apiRouter = express.Router()
const userController = require('./controllers/userController')


apiRouter.post('/login', userController.apiLogin)

module.exports = apiRouter