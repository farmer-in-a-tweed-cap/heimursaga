const User = require('../models/User')
const Entry = require('../models/Entry')
const Follow = require('../models/Follow')
const Flag = require('../models/Flag')
const entriesCollection = require('../db').db().collection("entries")
const followsCollection = require('../db').db().collection("follows")
const usersCollection = require('../db').db().collection("users")
const draftsCollection = require('../db').db().collection("drafts")
const likesCollection = require('../db').db().collection("likes")
const highlightsCollection = require('../db').db().collection("highlights")
const GeoJSON = require('geojson')
const Draft = require('../models/Draft')
const Highlight = require('../models/Highlight')
const sendgrid = require('@sendgrid/mail')
const { TouchPitchHandler } = require('mapbox-gl')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)
const sanitizeHTML = require('sanitize-html')
const validator = require("validator")
const Bookmark = require('../models/Bookmark')
const Stripe = require('../stripe')
const billingController =  require('../models/Billing');
const { createCustomer } = require('./billingController')
const Billing = require('../models/Billing')
const billingCollection = require('../db').db().collection("billing")
const Notification = require('../models/Notification')


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

  //let notifications = await Notification.getNotificationsByUser(req.session.user.username)

  req.entryCount = entryCount
  req.followerCount = followerCount
  req.followingCount = followingCount
  //req.notifications = notifications

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

exports.login =  function(req, res) {
  let user = new User(req.body)
  user.login().then(async function(result) {
    req.session.user = {
      avatar: user.avatar,
      username: user.data.username,
      _id: user.data._id,
    };

    //check from billing collection if trial expired or not
    const billingInfo =  await billingCollection.findOne({ explorerId: user.data._id })
    if (billingInfo) {
      req.session.user["billingId"] = billingInfo.billingId;
      req.session.user["plan"] = billingInfo.plan;
    }
    else {
      const stripeCustomerId = await Billing.createCustomer(user.data.username);
      req.session.user["billingId"] = stripeCustomerId;
      req.session.user["plan"] = "none";
    }
    req.session.save(function () {
      req.flash("success", `Welcome, ${user.data.username}!`);
      res.redirect("my-feed");
    });
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

exports.userGuide = function(req, res) {
  res.render('user-guide', {pageName: 'user-guide'})
}

exports.upgrade = async function(req, res) {
  //get billing details for upgrade page
  const billing = await billingCollection.findOne({
    billingId:  req.session.user.billingId,
  });
  User.findByUsername(req.profileUser.username).then(function (user) {
    res.render("upgrade", {
      pageName: "upgrade",
      email: user.email,
      plan: billing?.plan,
      endDate: billing?.endDate,
      hasTrial: billing?.hasTrial,
      billingId: req.session.user?.billingId,
      username: req.params.username,
      stripeAccountId: user.stripeAccountId || null,
      stripePubKey: process.env.STRIPE_PUB_KEY
    });
  });
}

exports.accounttype = async function(req, res) {
  if (req.isVisitorsProfile == true) {
    User.findByUsername(req.params.username).then(function(user){
    res.render('account-type', {
      pageName: "account-type",
      email: user.email,
      stripePubKey: process.env.STRIPE_PUB_KEY,
    })
    })
} else {
  req.session.save(function() {
    res.redirect(`/`)
  })
}}

exports.register = function(req, res) {
  let user = new User(req.body)
  user.register().then(() => {
    sendgrid.send({
      to: "admin@heimursaga.com",
      from: "admin@heimursaga.com",
      subject: `New Explorer Account: ${user.data.username}`,
      text: `An explorer has signed up for a new account. Username: ${user.data.username}, Email: ${user.data.email}, Journal link: https://heimursaga.com/journal/${user.data.username}.`,
      html: `An explorer has signed up for a new account. </p>Username: ${user.data.username} </br>Email: ${user.data.email} </br>Journal Link: <a href="https://heimursaga.com/journal/${user.data.username}">https://heimursaga.com/journal/${user.data.username}</a>`,
    });
    sendgrid.send({
      to: `${user.data.email}`,
      from: "explorer1@heimursaga.com",
      subject: `Welcome to Heimursaga, ${user.data.username}!`,
      text: `Greetings ${user.data.username}, I wanted to personally welcome you to Heimursaga. We're so excited you've decided to join this community. Please read The Explorer Code (https://heimursaga.com/explorer-code) before posting any entries, and don't forget to follow and support your favorite explorers! Regards, explorer1`,
      html: `<p>Greetings ${user.data.username},</p><p>I want to personally welcome you to Heimursaga! We're so excited you've decided to join this community.</p><p>Please read <a href="https://heimursaga.com/explorer-code">The Explorer Code</a> before posting any entries, and don't forget to follow and support your favorite explorers!</p><br><p>Regards, <br>explorer1</p>`,
    });

      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      req.session.save(function () {
        //req.flash("success", `Welcome to Heimursaga, ${user.data.username}!`);
        res.redirect(`account-type/${user.data.username}`);
      });
  }).catch(function(e) {
    req.flash('errors', e)
    req.session.save(function() {
      res.redirect('/join')
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
    const billing = await billingCollection.findOne({
      billingId:  req.session.user.billingId,
    });
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
      settings: user.settings,
      plan: billing?.plan,
      endDate: billing?.endDate,
      hasTrial: billing?.hasTrial,
      billingId: req.session.user?.billingId,
      username: req.params.username,
      stripeAccountId: user.stripeAccountId || null,
      stripePubKey: process.env.STRIPE_PUB_KEY
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
          req.session.save(function() {
              req.flash("success", `Welcome to Heimursaga, ${user.username}!`)
              res.redirect(`/user-guide`)
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

  if (req.isVisitorsProfile == true) {
  // ask our post model for posts by a certain author id

  Entry.findByAuthorId(req.profileUser._id).then(async function(entries) {

    let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
    let following = await Follow.getFollowingById(req.profileUser._id)
    let followers = await Follow.getFollowersById(req.profileUser._id)
    let highlightedEntries = await Highlight.getHighlightedById(req.profileUser._id)
    let bookmarkedEntries = await Bookmark.getBookmarkedById(req.profileUser._id)
    let drafts = await Draft.findByAuthorId(req.profileUser._id)
    let user = await User.findByUsername(req.profileUser.username)
    let journeys = await Entry.findJourneysByUsername(req.profileUser.username)

    if (req.isVisitorsProfile == true){
      res.render('journal', {
        pageName: "my-journal",
        entries: entries,
        selectedJourney: null,
        journeys: journeys,
        drafts: drafts,
        followers: followers,
        following: following,
        highlighted: highlightedEntries,
        bookmarked: bookmarkedEntries,
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
        stripeAccountId: user.stripeAccountId || null,
        stripePubKey: process.env.STRIPE_PUB_KEY,
        counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    } else {
    res.render('journal', {
      pageName: "journal",
      entries: entries,
      journeys: journeys,
      selectedJourney: null,
      drafts: drafts,
      followers: followers,
      following: following,
      highlighted: highlightedEntries,
      bookmarked: bookmarkedEntries,
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
      stripeAccountId: user.stripeAccountId || null,
      stripePubKey: process.env.STRIPE_PUB_KEY,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })}
  }).catch(function() {
    res.render("404")
  })

} else {
  Entry.findPublicByAuthorId(req.profileUser._id).then(async function(entries) {

    let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
    let following = await Follow.getFollowingById(req.profileUser._id)
    let followers = await Follow.getFollowersById(req.profileUser._id)
    let highlightedEntries = await Highlight.getHighlightedById(req.profileUser._id)
    let bookmarkedEntries = await Bookmark.getBookmarkedById(req.profileUser._id)
    let drafts = await Draft.findByAuthorId(req.profileUser._id)
    let user = await User.findByUsername(req.profileUser.username)
    let journeys = await Entry.findJourneysByUsername(req.profileUser.username)


    if (req.isVisitorsProfile == true){
      res.render('journal', {
        pageName: "my-journal",
        entries: entries,
        journeys: journeys,
        selectedJourney: null,
        drafts: drafts,
        followers: followers,
        following: following,
        highlighted: highlightedEntries,
        bookmarked: bookmarkedEntries,
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
        stripeAccountId: user.stripeAccountId || null,
        stripePubKey: process.env.STRIPE_PUB_KEY,
        counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    } else {
    res.render('journal', {
      pageName: "journal",
      entries: entries,
      journeys: journeys,
      selectedJourney: null,
      drafts: drafts,
      followers: followers,
      following: following,
      highlighted: highlightedEntries,
      bookmarked: bookmarkedEntries,
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
      stripeAccountId: user.stripeAccountId || null,
      stripePubKey: process.env.STRIPE_PUB_KEY,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })}
  }).catch(function() {
    res.render("404")
  })
}}

exports.journalScreenPro = function(req, res) {

  if (req.isVisitorsProfile == true) {
  // ask our post model for posts by a certain author id

  Entry.findByAuthorIdandJourney(req.params.journey, req.profileUser._id).then(async function(entries) {

    let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
    let following = await Follow.getFollowingById(req.profileUser._id)
    let followers = await Follow.getFollowersById(req.profileUser._id)
    let highlightedEntries = await Highlight.getHighlightedById(req.profileUser._id)
    let bookmarkedEntries = await Bookmark.getBookmarkedById(req.profileUser._id)
    let drafts = await Draft.findByAuthorId(req.profileUser._id)
    let user = await User.findByUsername(req.profileUser.username)
    let journeys = await Entry.findJourneysByUsername(req.profileUser.username)

    if (req.isVisitorsProfile == true){
      res.render('journal', {
        pageName: "my-journal",
        entries: entries,
        selectedJourney: req.params.journey,
        journeys: journeys,
        drafts: drafts,
        followers: followers,
        following: following,
        highlighted: highlightedEntries,
        bookmarked: bookmarkedEntries,
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
        stripeAccountId: user.stripeAccountId || null,
        stripePubKey: process.env.STRIPE_PUB_KEY,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    } else {
    res.render('journal', {
      pageName: "journal",
      entries: entries,
      selectedJourney: req.params.journey,
      drafts: drafts,
      followers: followers,
      following: following,
      highlighted: highlightedEntries,
      bookmarked: bookmarkedEntries,
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
      stripeAccountId: user.stripeAccountId || null,
      stripePubKey: process.env.STRIPE_PUB_KEY,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })}
  }).catch(function() {
    res.render("404")
  })

} else {
  Entry.findPublicByAuthorIdandJourney(req.params.journey, req.profileUser._id).then(async function(entries) {

    let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
    let following = await Follow.getFollowingById(req.profileUser._id)
    let followers = await Follow.getFollowersById(req.profileUser._id)
    let highlightedEntries = await Highlight.getHighlightedById(req.profileUser._id)
    let bookmarkedEntries = await Bookmark.getBookmarkedById(req.profileUser._id)
    let drafts = await Draft.findByAuthorId(req.profileUser._id)
    let user = await User.findByUsername(req.profileUser.username)
    let journeys = await Entry.findJourneysByUsername(req.profileUser.username)

    if (req.isVisitorsProfile == true){
      res.render('journal', {
        pageName: "my-journal",
        entries: entries,
        selectedJourney: req.params.journey,
        journeys: journeys,
        drafts: drafts,
        followers: followers,
        following: following,
        highlighted: highlightedEntries,
        bookmarked: bookmarkedEntries,
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
        stripeAccountId: user.stripeAccountId || null,
        stripePubKey: process.env.STRIPE_PUB_KEY,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    } else {
    res.render('journal', {
      pageName: "journal",
      entries: entries,
      selectedJourney: req.params.journey,
      journeys: journeys,
      drafts: drafts,
      followers: followers,
      following: following,
      highlighted: highlightedEntries,
      bookmarked: bookmarkedEntries,
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
      stripeAccountId: user.stripeAccountId || null,
      stripePubKey: process.env.STRIPE_PUB_KEY,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {entryCount: req.entryCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })}
  }).catch(function() {
    res.render("404")
  })
}}


exports.myFeed = async function(req, res) {
  if (req.session.user){
  let userData = await User.findByUsername(req.session.user.username)
  // ask our post model for posts by a certain author id
  let following = await Follow.getFollowingById(req.session.user._id)
      res.render('my-feed', {
        pageName: "my-feed",
        following: following,
        userEmail: userData.email
      })
    } else {
    res.redirect('/')}
  }

exports.feedEntryList = async function(req, res) {
    await Entry.getFollowedFeed(req.params.bounds, req.session.user._id).then(entries => {
        res.send(entries)
    }).catch(() => {
        res.json([])
    })
}

exports.journalEntryList = async function(req, res) {
  if (req.params.journey) {
    
    if (req.isVisitorsProfile) {
      await Entry.getMyJournalFeedbyJourney(req.params.bounds, req.profileUser._id, req.params.journey).then(entries => {
        res.json(entries)})
    } else {
      await Entry.getJournalFeedbyJourney(req.params.bounds, req.profileUser._id, req.params.journey).then(entries => {
        res.json(entries)
      }).catch(() => {
        res.json([])
    })
  }
  } else {

    if (req.isVisitorsProfile) {
      await Entry.getMyJournalFeed(req.params.bounds, req.profileUser._id).then(entries => {
        res.json(entries)})
    } else {
      await Entry.getJournalFeed(req.params.bounds, req.profileUser._id).then(entries => {
        res.json(entries)
      }).catch(() => {
        res.json([])
    })

  }

}}

exports.journalEntryListDate = async function(req, res) {
  if (req.params.journey) {
    
    if (req.isVisitorsProfile) {
      await Entry.getMyJournalFeedbyJourneyandDate(req.params.bounds, req.profileUser._id, req.params.journey).then(entries => {
        res.json(entries)})
    } else {
      await Entry.getJournalFeedbyJourneyandDate(req.params.bounds, req.profileUser._id, req.params.journey).then(entries => {
        res.json(entries)
      }).catch(() => {
        res.json([])
    })
  }
  } else {

    if (req.isVisitorsProfile) {
      await Entry.getMyJournalFeed(req.params.bounds, req.profileUser._id).then(entries => {
        res.json(entries)})
    } else {
      await Entry.getJournalFeed(req.params.bounds, req.profileUser._id).then(entries => {
        res.json(entries)
      }).catch(() => {
        res.json([])
    })

  }

}}


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

  exports.notifications = async function(req, res) {
    await Notification.getNotificationsByUser(req.params.username).then((notifications) => {
      res.send(notifications)
    }
    ).catch(() => {
      res.json([])
    })
  }

  exports.markNotificationsAsRead = async function(req, res) {
    await Notification.markNotificationsAsRead(req.params.username).then(() => {
      res.json({message: "Success"})
    }).catch(() => {
      res.json([])
    })
  }
