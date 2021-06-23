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
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)


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
      res.redirect('/')
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
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(function() {
      res.redirect('getting-started')
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
      website: user.website
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
          req.flash("success", "User successfully updated.")
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
    //let drafts = await Draft.findByAuthorId(req.profileUser._id)
    let user = await User.findByUsername(req.profileUser.username)
    if (req.isVisitorsProfile == true){
      res.render('journal', {
        pageName: "my-journal",
        entries: entries,
        //drafts: drafts,
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
      //drafts: drafts,
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




