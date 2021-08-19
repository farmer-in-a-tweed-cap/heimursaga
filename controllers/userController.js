const User = require('../models/User')
const Entry = require('../models/Entry')
const Follow = require('../models/Follow')
const Flag = require('../models/Flag')
const entriesCollection = require('../db').db().collection("entries")
const followsCollection = require('../db').db().collection("follows")
const usersCollection = require('../db').db().collection("users")
const draftsCollection = require('../db').db().collection("drafts")
const likesCollection = require('../db').db().collection("likes")
const GeoJSON = require('geojson')
const Draft = require('../models/Draft')
const Like = require('../models/Like')
const sendgrid = require('@sendgrid/mail')
const { TouchPitchHandler } = require('mapbox-gl')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)
const sanitizeHTML = require('sanitize-html')
const validator = require("validator")


exports.sharedProfileData = async function(req, res, next) {
  let isVisitorsProfile = false
  let isFollowing = false
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }

  req.isVisitorsProfile = isVisitorsProfile
  req.isFollowing = isFollowing
  // retrieve entry, follower, and following counts
  let entryCountPromise = Entry.countEntriesByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
  let [entryCount, followerCount, followingCount] = await Promise.all([entryCountPromise, followerCountPromise, followingCountPromise])

  req.entryCount = entryCount
  req.followerCount = followerCount
  req.followingCount = followingCount

  next()
}

exports.mustBeLoggedIn = function(req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash("errors", "You must be logged in to perform that action.")
    req.session.save(function() {
      res.redirect('login')
    })
  }
}

exports.login = function(req, res) {
  let user = new User(req.body)
  user.login().then(function(result) {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
    req.session.save(function() {
      res.redirect('my-feed')
    })
  }).catch(function(e) {
    req.flash('errors', e)
    req.session.save(function() {
      res.redirect('/login')
    })
  })
}


exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/')
  })
}

exports.upgrade = async function(req, res) {
    User.findByUsername(req.profileUser.username).then(function(user){
    res.render('upgrade', {
      pageName: "upgrade",
      email: user.email,
    })
    })
}

exports.accounttype = async function(req, res) {
    User.findByUsername(req.profileUser.username).then(function(user){
    res.render('account-type', {
      pageName: "account-type",
      email: user.email,
    })
    })
}

exports.register = function(req, res) {
  let user = new User(req.body)
  user.register().then(() => {
    sendgrid.send({
            to: 'admin@heimursaga.com',
            from: 'admin@heimursaga.com',
            subject: `New Explorer Account: ${user.data.username}`,
            text: `An explorer has signed up for a new account. Username: ${user.data.username}, Email: ${user.data.email}, Journal link: https://heimursaga.com/journal/${user.data.username}.`,
            html: `An explorer has signed up for a new account. </p>Username: ${user.data.username} </br>Email: ${user.data.email} </br>Journal Link: <a href="https://heimursaga.com/journal/${user.data.username}">https://heimursaga.com/journal/${user.data.username}</a>`
        })
      sendgrid.send({
            to: `${user.data.email}`,
            from: 'explorer1@heimursaga.com',
            subject: `Welcome to Heimursaga, ${user.data.username}!`,
            text: `Greetings ${user.data.username}, I wanted to personally welcome you to Heimursaga. We're so excited you've decided to join this community. Please read The Explorer Code (https://heimursaga.com/explorer-code) before posting any entries, and don't forget to follow and support your favorite explorers! Regards, explorer1`,
            html: `<p>Greetings ${user.data.username},</p><p>I want to personally welcome you to Heimursaga! We're so excited you've decided to join this community.</p><p>Please read <a href="https://heimursaga.com/explorer-code">The Explorer Code</a> before posting any entries, and don't forget to follow and support your favorite explorers!</p><br><p>Regards, <br>explorer1</p>`
      })
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(function() {
      res.redirect(`/account-type/${user.data.username}`)
    })
  }).catch(function(e) {
    req.flash('errors', e)
    req.session.save(function() {
      res.redirect('/register')
    })
  })
}

exports.home = async function(req, res) {
  if (req.session.user) {
    // fetch feed of posts for current user
    let entries = await Entry.getFeed(req.session.user._id)
    res.render('my-feed', {
      entries: entries, 
      pageName: "my-feed",
    })
  } else {
    res.render('discovery', {regErrors: req.flash('regErrors')})
  }
}

exports.viewSettings = async function(req, res) {
  if (req.isVisitorsProfile == true) {
    User.findByUsername(req.profileUser.username).then(function(user){
    res.render('settings', {
      pageName: "settings",
      email: user.email,
      bio: user.bio,
      currentlyin: user.currentlyin,
      livesin: user.livesin,
      from: user.from,
      instagram: user.instagram,
      website: user.website,
      settings: user.settings
    })
    })
  } else {
    req.session.save(function() {
      res.redirect('/')
    })
  }
}

exports.edit = function(req, res) {
  let user = new User(req.body, req.params.username)
  user.update().then((status) => {
      // the user was successfully updated in the database
      // or user did have permission, but there were validation errors
      if (status == "success") {
          // user was updated in db
          req.flash("success", "Profile successfully updated.")
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      } else {
          user.errors.forEach(function(error) {
              req.flash("errors", error)
          })
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      }
  }).catch(() => {
      // if user with requested id doesn't exist
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(function() {
          res.redirect(`/settings/${req.params.username}`)
      })
  })
}

exports.updatePassword = function(req, res) {
  let user = new User(req.body, req.params.username)
  user.updatePassword().then((status) => {
      // the user was successfully updated in the database
      // or user did have permission, but there were validation errors
      if (status == "success") {
          // user was updated in db
          req.flash("success", "Password successfully updated.")
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      } else {
          user.errors.forEach(function(error) {
              req.flash("errors", error)
          })
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      }
  }).catch(() => {
      // if user with requested id doesn't exist
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(function() {
          res.redirect(`/settings/${req.params.username}`)
      })
  })
}

exports.updateNotifications = function(req, res) {
  let user = new User(req.body, req.params.username)
  user.updateNotifications().then((status) => {
      // the user was successfully updated in the database
      // or user did have permission, but there were validation errors
      if (status == "success") {
          // user was updated in db
          req.flash("success", "Notifications successfully updated.")
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      } else {
          user.errors.forEach(function(error) {
              req.flash("errors", error)
          })
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      }
  }).catch(() => {
      // if user with requested id doesn't exist
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(function() {
          res.redirect(`/settings/${req.params.username}`)
      })
  })
}

exports.updateType = function(req, res) {
  let user = new User(req.body, req.params.username)
  user.updateType().then((status) => {
      // the user was successfully updated in the database
      // or user did have permission, but there were validation errors
      if (status == "success") {
          // user was updated in db
          req.flash("success", "Account type successfully updated.")
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      } else {
          user.errors.forEach(function(error) {
              req.flash("errors", error)
          })
          req.session.save(function() {
              res.redirect(`/settings/${req.params.username}`)
          })
      }
  }).catch(() => {
      // if user with requested id doesn't exist
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(function() {
          res.redirect(`/settings/${req.params.username}`)
      })
  })
}

exports.selectType = function(req, res) {
  let user = new User(req.body, req.params.username)
  user.updateType().then((status) => {
      // the user was successfully updated in the database
      // or user did have permission, but there were validation errors
      if (status == "success") {
          // user was updated in db
          req.flash("success", "Welcome to Heimursaga!")
          req.session.save(function() {
              res.redirect(`/getting-started`)
          })
      } else {
          user.errors.forEach(function(error) {
              req.flash("errors", error)
          })
          req.session.save(function() {
              res.redirect(`/account-type/`)
          })
      }
  }).catch(() => {
      // if user with requested id doesn't exist
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(function() {
          res.redirect(`/`)
      })
  })
}

exports.ifUserExists = function(req, res, next) {
  User.findByUsername(req.params.username).then(function(userDoc) {
    req.profileUser = userDoc
    next()
  }).catch(function() {
    res.render("404")
  })
}

exports.journalScreen = function(req, res) {
  // ask our post model for posts by a certain author id
  Entry.findByAuthorId(req.profileUser._id).then(async function(entries) {
    let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
    let following = await Follow.getFollowingById(req.profileUser._id)
    let followers = await Follow.getFollowersById(req.profileUser._id)
    let likedEntries = await Like.getLikedById(req.profileUser._id)
    let drafts = await Draft.findByAuthorId(req.profileUser._id)
    let user = await User.findByUsername(req.profileUser.username)
    if (req.isVisitorsProfile == true){
      res.render('journal', {
        pageName: "my-journal",
        entries: entries,
        drafts: drafts,
        followers: followers,
        following: following,
        liked: likedEntries,
        bio: user.bio,
        currentlyin: user.currentlyin,
        livesin: user.livesin,
        from: user.from,
        instagram: user.instagram,
        website: user.website,
        type: user.type,
        entrymarker: JSON.stringify(entryMarker),
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    } else {
    res.render('journal', {
      pageName: "journal",
      entries: entries,
      drafts: drafts,
      followers: followers,
      following: following,
      liked: likedEntries,
      bio: user.bio,
      currentlyin: user.currentlyin,
      livesin: user.livesin,
      from: user.from,
      instagram: user.instagram,
      website: user.website,
      type: user.type,
      entrymarker: JSON.stringify(entryMarker),
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })}
  }).catch(function() {
    res.render("404")
  })

}

exports.myFeed = async function(req, res) {
  if (req.session.user){
  // ask our post model for posts by a certain author id
  let entries = await Entry.getFollowedFeed(req.session.user._id)
  let following = await Follow.getFollowingById(req.session.user._id)
  let hasVisitorFlagged = await Flag.hasVisitorFlagged(entries._id, req.visitorId)
  let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
      res.render('my-feed', {
        pageName: "my-feed",
        entries: entries,
        following: following,
        entrymarker: JSON.stringify(entryMarker),
        hasVisitorFlagged: hasVisitorFlagged
      })
    } else {
    res.render('discover', {
      pageName: "discover",
      entries: entries,
      entrymarker: JSON.stringify(entryMarker),
    })}
  }


exports.profileFollowersScreen = async function(req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  } catch {
    res.render("404")
  }
}

exports.profileFollowingScreen = async function(req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id)
    res.render('profile-following', {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  } catch {
    res.render("404")
  }
}


exports.viewAll = async function(req,res) {
  let entries = await entriesCollection.find({}).sort({createdDate: -1}).toArray()
  let users = await usersCollection.find({}).toArray()

  let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})

  res.render('journal-feed', {
    pageName: "journal-feed",
    users: users,
    entries: entries,
    entrymarker: JSON.stringify(entryMarker)
})
}



exports.recover = function(req, res) {
  User.findByEmail(req.body.email).then((foundUser) => {
    if (foundUser) {
      let user = new User(req.body)
      user.generatePasswordReset()
      user.updateTokens().then(function(result) {
        let link = "https://heimursaga.com/reset-password/"+user.resetPasswordToken;
        sendgrid.send({
          to: foundUser.email,
          from: 'admin@heimursaga.com',
          subject: "Password Change Request",
          text: `Greetings ${foundUser.username}, \n 
          Please click on the following link to reset your password.\n\n ${link}  \n\n 
          If you did not request this, ignore this email and your password will remain unchanged.\n`})  
          req.flash('success', "A password reset email has been sent. Please check your inbox.")
          res.redirect('/login')
      }).catch(function(e) {
        req.flash('errors', e)
        res.redirect('/login')
      })
    }
  }).catch(function(e) {
    req.flash('errors', e)
    res.redirect('/login')
  })
}

exports.reset = (req, res) => {
  User.findByToken(req.params.token)
      .then((user) => {
          //Redirect user to form with the email address
          res.render('reset', {user});
      })
      .catch(function(e) {
        req.flash('errors', e)
        res.redirect('/login');
  })
}


exports.resetPassword = function(req, res) {
  User.findByToken(req.params.token).then((foundUser) => {
      let user = new User(req.body)
      user.resetPassword(req.body).then(function(result) {
        sendgrid.send({
          to: foundUser.email,
          from: 'admin@heimursaga.com',
          subject: "Your password has been changed",
          text: `Greetings ${foundUser.username}, This is confirmation that the password for the account associated with this email address has been changed.`})
          req.flash('success', "Your password has been successfully changed. Please login.")
          res.redirect('/login')
      }).catch(function(e) {
        req.flash('errors', e)
        res.redirect('/login')
      })
    })
  }