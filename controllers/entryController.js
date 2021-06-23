const Entry = require('../models/Entry')
const Like = require('../models/Like')
const Flag = require('../models/Flag')
const Draft = require('../models/Draft')
const sessionsCollection = require('../db').db().collection("sessions")
const GeoJSON = require('geojson')
const { db } = require('../db')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)


//sessionsCollection.deleteMany()


exports.viewCreateScreen = function(req, res) {
    res.render('create-entry', {pageName: 'create-entry'})
}

exports.create = function(req, res) {
    let entry = new Entry(req.body, req.session.user._id, req.session.user.username)
    entry.create().then(function(newId) {
        req.flash("success", "New entry successfully posted.")
        req.session.save(() => res.redirect(`/entry/${newId}`))
    }).catch(function(errors){
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-entry"))
    })
}

exports.viewSingle = async function(req, res) {
    try {
        let entry = await Entry.findSingleById(req.params.id, req.visitorId)
        let likes = await Like.countLikesById(req.params.id)
        let hasVisitorLiked = await Like.hasVisitorLiked(req.params.id, req.visitorId)
        let entryMarker = GeoJSON.parse(entry.GeoJSONcoordinates, {'Point': ['entry.GeoJSONcoordinates.coordinates[0]','entry.GeoJSONcoordinates.coordinates[1]']})
        res.render('single-entry', {entry: entry, pageName: "single-entry", likeCount: likes, hasVisitorLiked: hasVisitorLiked, entrymarker: JSON.stringify(entryMarker)})
    } catch {
        res.render('pages-404')
    }
}

exports.viewSingleLikes = async function(req, res) {
    try {
        let entry = await Entry.findSingleById(req.params.id, req.visitorId)
        let likes = await Like.countLikesById(req.params.id)
        let hasVisitorLiked = await Like.hasVisitorLiked(req.params.id, req.visitorId)
        let hasVisitorFlagged = await Flag.hasVisitorFlagged(req.params.id, req.visitorId)
        let entryMarker = GeoJSON.parse(entry, {GeoJSON: 'GeoJSONcoordinates'})
        res.render('single-entry-likes', {entry: entry, pageName: "single-entry-likes", likeCount: likes, hasVisitorLiked: hasVisitorLiked, hasVisitorFlagged: hasVisitorFlagged, entrymarker: JSON.stringify(entryMarker)})
    } catch {
        res.render('pages-404')
    }
}

exports.viewSingleFlags = async function(req, res) {
    try {
        let entry = await Entry.findSingleById(req.params.id, req.visitorId)
        let hasVisitorFlagged = await Flag.hasVisitorFlagged(req.params.id, req.visitorId)
        let entryMarker = GeoJSON.parse(entry, {GeoJSON: 'GeoJSONcoordinates'})
        res.render('single-entry-flags', {entry: entry, pageName: "single-entry-flags", hasVisitorFlagged: hasVisitorFlagged, entrymarker: JSON.stringify(entryMarker)})
    } catch {
        res.render('pages-404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
      let entry = await Entry.findSingleById(req.params.id, req.visitorId)
      let entryMarker = GeoJSON.parse(entry.GeoJSONcoordinates, {'Point': ['entry.GeoJSONcoordinates.coordinates[0]','entry.GeoJSONcoordinates.coordinates[1]']})
      if (entry.isVisitorOwner) {
        res.render("edit-entry", {entry: entry, entrymarker: JSON.stringify(entryMarker), pageName: "edit-entry"})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }

exports.edit = function(req, res) {
    let entry = new Entry(req.body, req.visitorId, req.session.user.username, req.params.id)
    entry.update().then((status) => {
        // the entry was successfully updated in the database
        // or user did have permission, but there were validation errors
        if (status == "success") {
            // entry was updated in db
            req.flash("success", "Entry successfully updated.")
            req.session.save(function() {
                res.redirect(`/entry/${req.params.id}`)
            })
        } else {
            entry.errors.forEach(function(error) {
                req.flash("errors", error)
            })
            req.session.save(function() {
                res.redirect(`/entry/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // if entry with requested id doesn't exist
        // or if current visitor is not the owner of requested entry
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

exports.delete = function(req, res) {
    Like.authorDelete(req.params.id, req.visitorId).then(() => {
        Entry.delete(req.params.id, req.visitorId)
        req.flash("success", "Entry successfully deleted.")
        req.session.save(() => res.redirect(`/journal/${req.session.user.username}`))
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}

exports.search = function(req, res) {
    Entry.search(req.body.searchTerm).then(entries => {
        res.json(entries)
    }).catch(() => {
        res.json([])
    })
}

exports.entryList = function(req, res) {
    Entry.getFeed().then(entries => {
        res.json(entries)
    }).catch(() => {
        res.json([])
    })
}

exports.getAll = async function(req, res) {
    let entries = await Entry.getFeed()
    let entryMarker = GeoJSON.parse(entries, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
    res.render('discovery', {
      pageName: "discovery",
      entries: entries,
      entrymarker: JSON.stringify(entryMarker)
    })
  }

exports.viewAll = async function(req,res) {
    Entry.returnAll().then((entries) => {
    res.render('journal-feed', {
        pageName: "journal-feed",
        entries: entries,
    }).catch(() => {
        res.render('404')
    })
    })
}
