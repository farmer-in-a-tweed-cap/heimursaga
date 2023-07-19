const express = require('express')
const userController = require('./controllers/userController')
const entryController = require('./controllers/entryController')
const followController = require('./controllers/followController')
const draftController = require('./controllers/draftController')
const highlightController = require('./controllers/highlightController')
const bookmarkController = require('./controllers/bookmarkController')
const flagController = require('./controllers/flagController')
const adminController = require('./controllers/adminController')
const photoController = require('./controllers/photoController')
const User = require('./models/User')
const billingController = require('./controllers/billingController');
const router = express.Router()
const { multerUploads } = require('./models/Photo')



// user related routes

router.get('/', function (req, res) {
  res.render('discovery', {pageName: 'discovery'})
})

router.get('/discovery', function (req, res) {
  res.render('discovery', {pageName: 'discovery'})
})

router.get('/login', function (req, res) {
  res.render('login', {pageName: 'login'})
})
router.get('/join', function (req, res) {
  res.render('join', {pageName: 'join'})
})
router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/logout', userController.logout)

router.get('/recover', function(req, res) {
  res.render('recover', {pageName: "recover-password"})
})

router.get('/privacy', function (req, res) {
  res.render('privacy-policy', {pageName: 'privacy'})
})

router.get('/user-guide', userController.mustBeLoggedIn, userController.userGuide)

router.post('/recover', userController.recover)
router.get('/reset-password/:token', userController.reset)
router.post('/reset-password/:token', userController.resetPassword)


// profile related routes
router.get('/journal/:username', userController.ifUserExists, userController.sharedProfileData, userController.journalScreen)
router.get('/journal/:username/:journey', userController.ifUserExists, userController.sharedProfileData, userController.journalScreenPro)
router.get('/my-feed', userController.mustBeLoggedIn, userController.myFeed)
router.get('/settings/:username', userController.ifUserExists, userController.sharedProfileData, userController.viewSettings)

router.post('/update-user/:username', userController.ifUserExists, userController.sharedProfileData, userController.edit)
router.post('/update-password/:username', userController.ifUserExists, userController.sharedProfileData, userController.updatePassword)
router.post('/update-notifications/:username', userController.ifUserExists, userController.sharedProfileData, userController.updateNotifications)


// entry related routes
router.get('/create-entry', userController.mustBeLoggedIn, entryController.viewCreateScreen)
router.post('/create-entry', userController.mustBeLoggedIn, multerUploads, entryController.create)


router.get('/entry/:id', entryController.viewSingle)
router.get('/entry/:id/edit', userController.mustBeLoggedIn, entryController.viewEditScreen)
router.post('/entry/:id/edit', userController.mustBeLoggedIn, multerUploads, entryController.edit)
router.post('/entry/:id/delete', userController.mustBeLoggedIn, entryController.delete)

router.post('/save-draft', userController.mustBeLoggedIn, multerUploads, draftController.create)
router.get('/draft/:id', draftController.viewSingle)
router.get('/draft/:id/edit', userController.mustBeLoggedIn, draftController.viewEditScreen)
router.post('/draft/:id/edit', userController.mustBeLoggedIn, multerUploads, draftController.edit)
router.post('/draft/:id/delete', userController.mustBeLoggedIn, draftController.delete)
router.post('/draft/:id/post-entry', userController.mustBeLoggedIn, multerUploads, draftController.postEntry)

router.post('/search', entryController.search)

router.get('/entry-list/:bounds', entryController.entryList)
router.get('/feed-entry-list/:bounds', userController.feedEntryList)
router.get('/journal-entry-list/:username/:bounds', userController.ifUserExists, userController.sharedProfileData, userController.journalEntryList)
router.get('/journal-entry-list/:username/:bounds/:journey', userController.ifUserExists, userController.sharedProfileData, userController.journalEntryListDate)




// photo specific coutes
router.post('/deletePhoto/:id', userController.mustBeLoggedIn, photoController.delete)

// button routes
router.get('/button-stack/:id', entryController.viewEntryButtons)
// highlight related routes
router.post('/addHighlight/:id', userController.mustBeLoggedIn, highlightController.addHighlight)
router.post('/removeHighlight/:id', userController.mustBeLoggedIn, highlightController.removeHighlight)
router.get('/highlightCount/:id', highlightController.highlightCount)
// bookmark related routes
router.post('/addBookmark/:id', userController.mustBeLoggedIn, bookmarkController.addBookmark)
router.post('/removeBookmark/:id', userController.mustBeLoggedIn, bookmarkController.removeBookmark)
router.get('/bookmarkCount/:id', bookmarkController.bookmarkCount)
// flag related routes
router.post('/addFlag/:id', userController.mustBeLoggedIn, flagController.addFlag)
router.get('/flag-button/:id', flagController.viewSingleFlags)
// follow related routes
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow)
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow)


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

router.get('/contact', function (req, res) {
  res.render('contact', {pageName: 'contact'})
})

router.get('/button-stack', function (req, res) {
  res.render('button-stack', {pageName: 'button-stack'})
})

router.get('/flag-button', function (req, res) {
  res.render('flag-button', {pageName: 'flag-button'})
})

//Admin Routes
router.get('/admin-dashboard', userController.mustBeLoggedIn, adminController.viewAdminDashboard)


//Explorer Pro Routes

router.post('/update-type/:username', userController.ifUserExists, userController.sharedProfileData, userController.updateType)
router.get('/upgrade/:username', userController.mustBeLoggedIn, userController.ifUserExists, userController.sharedProfileData, userController.upgrade)
router.get('/account-type/:username', userController.mustBeLoggedIn, userController.ifUserExists, userController.sharedProfileData, userController.accounttype)
router.post('/select-type/:username', userController.mustBeLoggedIn, userController.ifUserExists, userController.sharedProfileData, userController.selectType)

//subscription Routes
router.get('/subscribe/:product_type',  billingController.subscribe)
router.get('/billing/:email/:customer',  billingController.Billing)


module.exports = router