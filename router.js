const express = require('express')
const { render } = require('./app')
const userController = require('./controllers/userController')
const entryController = require('./controllers/entryController')
const followController = require('./controllers/followController')
const draftController = require('./controllers/draftController')
const likeController = require('./controllers/likeController')
const User = require('./models/User')
const router = express.Router()


// user related routes
router.get('/', userController.getAll)

router.get('/login', function (req, res) {
  res.render('login', {pageName: 'login'})
})
router.get('/register', function (req, res) {
  res.render('register', {pageName: 'register'})
})
router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/logout', userController.logout)

router.get('/single-entry', function (req, res) {
  res.render('single-entry copy', {pageName: 'single'})
})

router.post('/update-user/:username', userController.ifUserExists, userController.sharedProfileData, userController.edit)

// profile related routes
router.get('/journal/:username', userController.ifUserExists, userController.sharedProfileData, userController.journalScreen)
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen)
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen)
router.get('/my-feed', userController.mustBeLoggedIn, userController.myFeed)
router.get('/settings/:username', userController.ifUserExists, userController.sharedProfileData, userController.viewSettings)


// entry related routes
router.get('/create-entry', userController.mustBeLoggedIn, entryController.viewCreateScreen)
router.post('/create-entry', userController.mustBeLoggedIn, entryController.create)
router.get('/entry/:id', entryController.viewSingle)
router.get('/entry/:id/edit', userController.mustBeLoggedIn, entryController.viewEditScreen)
router.post('/entry/:id/edit', userController.mustBeLoggedIn, entryController.edit)
router.post('/entry/:id/delete', userController.mustBeLoggedIn, entryController.delete)
router.post('/search', entryController.search)
router.get('/single-entry-likes/:id', entryController.viewSingleLikes)

router.post('/save-draft', userController.mustBeLoggedIn, draftController.create)
router.get('/draft/:id', draftController.viewSingle)
router.get('/draft/:id/edit', userController.mustBeLoggedIn, draftController.viewEditScreen)
router.post('/draft/:id/edit', userController.mustBeLoggedIn, draftController.edit)
router.post('/draft/:id/delete', userController.mustBeLoggedIn, draftController.delete)

router.post('/search', entryController.search)


// follow related routes
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow)
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow)

// like related routes
router.post('/addLike/:id', userController.mustBeLoggedIn, likeController.addLike)
router.post('/removeLike/:id', userController.mustBeLoggedIn, likeController.removeLike)



// navigation related routes
router.get('/my-profile', function (req, res) {
  res.render('my-profile', {pageName: 'my-profile'})
})
//router.get('/settings', function (req, res) {
//  res.render('settings', {pageName: 'settings'})
//})
router.get('/discovery', userController.getAll)

router.get('/home', userController.viewAll)

router.get('/forms-advanced-inputs', function (req, res) {
  res.render('forms-advanced-inputs', {pageName: 'forms-advanced-inputs'})
})
router.get('/forms-basic-inputs', function (req, res) {
  res.render('forms-basic-inputs', {pageName: 'forms-basic-inputs'})
})
router.get('/forms-editors', function (req, res) {
  res.render('forms-editors', {pageName: 'forms-editors'})
})
router.get('/forms-floating-labels', function (req, res) {
  res.render('forms-floating-labels', {pageName: 'forms-floating-labels'})
})
router.get('/forms-input-groups', function (req, res) {
  res.render('forms-input-groups', {pageName: 'forms-input-groups'})
})
router.get('/forms-layouts', function (req, res) {
  res.render('forms-layouts', {pageName: 'forms-layouts'})
})
router.get('/forms-validation', function (req, res) {
  res.render('forms-validation', {pageName: 'forms-validation'})
})

router.get('/getting-started', function (req, res) {
  res.render('getting-started', {pageName: 'getting-started'})
})

router.get('/explorer-code', function (req, res) {
  res.render('explorer-code', {pageName: 'explorer-code'})
})

router.get('/about', function (req, res) {
  res.render('about', {pageName: 'about'})
})

router.get('/contact', function (req, res) {
  res.render('contact', {pageName: 'contact'})
})

// template routes (delete before publishing)
router.get('/dashboard-default', function (req, res) {
  res.render('dashboard-default', {pageName: 'dashboard-default'})
})
router.get('/ui-buttons', function (req, res) {
  res.render('ui-buttons', {pageName: 'ui-buttons'})
})
router.get('/tables-bootstrap', function (req, res) {
  res.render('tables-bootstrap', {pageName: 'tables-bootstrap'})
})
router.get('/icons-feather', function (req, res) {
  res.render('icons-feather', {pageName: 'icons-feather'})
})
router.get('/icons-font-awesome', function (req, res) {
  res.render('icons-font-awesome', {pageName: 'icons-font-awesome'})
})



module.exports = router