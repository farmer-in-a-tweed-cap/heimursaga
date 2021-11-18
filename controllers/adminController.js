const User = require('../models/User')
const Entry = require('../models/Entry')
const Follow = require('../models/Follow')
const Flag = require('../models/Flag')
const entriesCollection = require('../db').db().collection("entries")
const followsCollection = require('../db').db().collection("follows")
const usersCollection = require('../db').db().collection("users")
const draftsCollection = require('../db').db().collection("drafts")
const likesCollection = require('../db').db().collection("likes")
const flagsCollection = require('../db').db().collection("flags")
const sessionsCollection = require('../db').db().collection("sessions")
const GeoJSON = require('geojson')
const Draft = require('../models/Draft')
const Like = require('../models/Like')
const sendgrid = require('@sendgrid/mail')
const { TouchPitchHandler } = require('mapbox-gl')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)
const sanitizeHTML = require('sanitize-html')
const validator = require("validator")
const { render } = require('ejs')
const ObjectID = require('mongodb').ObjectID


//usersCollection.updateMany({}, {$set: {registeredDate: new Date()}})


exports.viewAdminDashboard = async function(req, res) {
  let entries = await entriesCollection.find({}).sort({createdDate: -1}).toArray()
  let users = await usersCollection.find({}).sort({createdDate: -1}).toArray()
  users = users.map(function(user) {
    let completeuser = new User(user, true)
    return {id: new ObjectID(user.id), username: user.username, avatar: completeuser.avatar, email: user.email, bio: user.bio, currentlyin: user.currentlyin, livesin: user.livesin, from: user.from, registeredDate: user.registeredDate, settings: user.settings}
  })
  let entrycount = await entriesCollection.countDocuments({})
  let usercount = await usersCollection.countDocuments({})
  let flagcount = await flagsCollection.countDocuments({})
  let sessioncount = await sessionsCollection.countDocuments({})
  let photocount = await entriesCollection.countDocuments({hasPhoto: true})
  let draftcount = await draftsCollection.countDocuments({})
  let flags = await flagsCollection.find({}).sort({createdDate: -1}).toArray()
  let sessions = await sessionsCollection.find({}).sort({createdDate: -1}).toArray()

  if(req.session.user.username == "explorer1") {
    res.render('admin-dashboard', {
      pageName: 'admin-dashboard',
      users: users,
      entries: entries,
      flags: flags,
      sessions: sessions,
      usercount: usercount,
      entrycount: entrycount,
      flagcount: flagcount,
      sessioncount: sessioncount,
      photocount: photocount,
      draftcount: draftcount
    })
  } else {
    res.render('404')
  }
}