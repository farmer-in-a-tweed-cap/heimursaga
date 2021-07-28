const express = require('express')
const { render } = require('./app')
const userController = require('./controllers/userController')
const entryController = require('./controllers/entryController')
const followController = require('./controllers/followController')
const draftController = require('./controllers/draftController')
const likeController = require('./controllers/likeController')
const flagController = require('./controllers/flagController')
const User = require('./models/User')
const router = express.Router()


// user related routes
router.get('/', entryController.getAll)
router.get('/discovery', entryController.getAll)

router.get('/login', function (req, res) {
  res.render('login', {pageName: 'login'})
})
router.get('/register', function (req, res) {
  res.render('register', {pageName: 'register'})
})
router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/logout', userController.logout)

router.get('/recover', function(req, res) {
  res.render('recover', {pageName: "recover-password"})
})

router.post('/recover', userController.recover)
router.get('/reset-password/:token', userController.reset)
router.post('/reset-password/:token', userController.resetPassword)


// profile related routes
router.get('/journal/:username', userController.ifUserExists, userController.sharedProfileData, userController.journalScreen)
router.get('/my-feed', userController.mustBeLoggedIn, userController.myFeed)
router.get('/settings/:username', userController.ifUserExists, userController.sharedProfileData, userController.viewSettings)

router.post('/update-user/:username', userController.ifUserExists, userController.sharedProfileData, userController.edit)
router.post('/update-password/:username', userController.ifUserExists, userController.sharedProfileData, userController.updatePassword)
router.post('/update-notifications/:username', userController.ifUserExists, userController.sharedProfileData, userController.updateNotifications)


// entry related routes
router.get('/create-entry', userController.mustBeLoggedIn, entryController.viewCreateScreen)
router.post('/create-entry', userController.mustBeLoggedIn, entryController.create)
router.get('/entry/:id', entryController.viewSingle)
router.get('/entry/:id/edit', userController.mustBeLoggedIn, entryController.viewEditScreen)
router.post('/entry/:id/edit', userController.mustBeLoggedIn, entryController.edit)
router.post('/entry/:id/delete', userController.mustBeLoggedIn, entryController.delete)

router.post('/save-draft', userController.mustBeLoggedIn, draftController.create)
router.get('/draft/:id', draftController.viewSingle)
router.get('/draft/:id/edit', userController.mustBeLoggedIn, draftController.viewEditScreen)
router.post('/draft/:id/edit', userController.mustBeLoggedIn, draftController.edit)
router.post('/draft/:id/delete', userController.mustBeLoggedIn, draftController.delete)
router.post('/draft/:id/post-entry', userController.mustBeLoggedIn, draftController.postEntry)

router.post('/search', entryController.search)

router.get('/entry-list', entryController.entryList)


// follow related routes
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow)
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow)

// like related routes
router.post('/addLike/:id', userController.mustBeLoggedIn, likeController.addLike)
router.post('/removeLike/:id', userController.mustBeLoggedIn, likeController.removeLike)
router.get('/single-entry-likes/:id', entryController.viewSingleLikes)

// flag related routes
router.post('/addFlag/:id', userController.mustBeLoggedIn, flagController.addFlag)
router.get('/single-entry-flags/:id', entryController.viewSingleFlags)



// navigation related routes
router.get('/my-profile', function (req, res) {
  res.render('my-profile', {pageName: 'my-profile'})
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

router.get('/upgrade', function (req, res) {
  res.render('upgrade', {pageName: 'upgrade'})
})

/*router.get('/contact', function (req, res) {
  res.render('contact', {pageName: 'contact'})
})*/

//router.post('/contact-form', userController.contactForm)


module.exports = router