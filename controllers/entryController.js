const Entry = require('../models/Entry')
const Highlight = require('../models/Highlight')
const Flag = require('../models/Flag')
const Draft = require('../models/Draft')
const sessionsCollection = require('../db').db().collection("sessions")
const GeoJSON = require('geojson')
const { db } = require('../db')
const sendgrid = require('@sendgrid/mail')
const { Photo } = require('../models/Photo')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)
const { Notyf } = require('notyf')
const { ObjectId } = require('mongodb')
const { hasVisitorHighlighted } = require('../models/Highlight')
const Bookmark = require('../models/Bookmark')
const Follow = require('../models/Follow')



//sessionsCollection.deleteMany()



exports.viewCreateScreen = async function(req, res) {
    //include explorer pro gate here
    let journeys = await Entry.findAllJourneysByUsername(req.session.user.username)
    res.render('create-entry', {pageName: 'create-entry', journeys: journeys})
}

exports.create = function(req, res) {
    let entry = new Entry(req.body, req.files, ObjectId(), req.session.user._id, req.session.user.username)
    if (req.files.length) {
    let photo = new Photo(req.files)
    entry.create().then(function(newId) {
        photo.uploadPhoto(newId).then(function() {
        req.flash("success", "New entry successfully posted.")
        req.session.save(() => res.redirect(`/entry/${newId}`))
    })}).catch(function(errors){
        req.flash("errors", "Error posting.")
        //errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-entry"))
    })
    } else {
    entry.create().then(function(newId) {
        req.flash("success", "New entry successfully posted.")
        req.session.save(() => res.redirect(`/entry/${newId}`))
    }).catch(function(errors){
        req.flash("errors", "Error posting.")
        //errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-entry"))
    })
}
}


exports.viewSingle = async function(req, res) {
    try {
        let entry = await Entry.findSingleById(req.params.id, req.visitorId)
        let highlights = await Highlight.countHighlightsById(req.params.id)
        let hasVisitorHighlighted = await Highlight.hasVisitorHighlighted(req.params.id, req.visitorId)
        let entryMarker = GeoJSON.parse(entry.GeoJSONcoordinates, {'Point': ['entry.GeoJSONcoordinates.coordinates[0]','entry.GeoJSONcoordinates.coordinates[1]']})
        res.render('single-entry', {entry: entry, pageName: "single-entry", highlightCount: highlights, hasVisitorHighlighted: hasVisitorHighlighted, entrymarker: JSON.stringify(entryMarker)})
    } catch {
        res.render('404')
    }
}


exports.viewEntryButtons = async function(req, res) {
    try {
        let entry = await Entry.findSingleById(req.params.id, req.visitorId)
        let highlights = await Highlight.countHighlightsById(req.params.id)
        let bookmarks = await Bookmark.countBookmarksById(req.params.id)
        let hasVisitorBookmarked = await Bookmark.hasVisitorBookmarked(req.params.id, req.visitorId)
        let hasVisitorHighlighted = await Highlight.hasVisitorHighlighted(req.params.id, req.visitorId)
        let hasVisitorFlagged = await Flag.hasVisitorFlagged(req.params.id, req.visitorId)
        let isVisitorFollowing = await Follow.isVisitorFollowing(entry.authorId, req.visitorId)
        res.render('button-stack', {entry: entry, pageName: "button-stack", highlightCount: highlights, bookmarkCount: bookmarks, hasVisitorHighlighted: hasVisitorHighlighted, hasVisitorBookmarked: hasVisitorBookmarked, isVisitorFollowing: isVisitorFollowing, hasVisitorFlagged: hasVisitorFlagged})
    } catch {
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
      let entry = await Entry.findSingleById(req.params.id, req.visitorId)
      let journeys = await Entry.findAllJourneysByUsername(req.session.user.username)
      let entryMarker = GeoJSON.parse(entry.GeoJSONcoordinates, {'Point': ['entry.GeoJSONcoordinates.coordinates[0]','entry.GeoJSONcoordinates.coordinates[1]']})
      if (entry.isVisitorOwner) {
        res.render("edit-entry", {entry: entry, journeys: journeys, entrymarker: JSON.stringify(entryMarker), pageName: "edit-entry"})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }

exports.edit = function(req, res) {
    let entry = new Entry(req.body, req.files, req.params.id, req.visitorId, req.session.user.username, req.params.id)
        if (req.files.length) {
            Photo.delete(req.params.id).then(() => {
            let photo = new Photo(req.files)
            photo.uploadPhoto(req.params.id).then(() => {
                entry.update2().then((status) => {
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
    })}).catch(() => {
        // if entry with requested id doesn't exist
        // or if current visitor is not the owner of requested entry
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
})} else if (req.body.photoindicator.length) {

    Photo.delete(req.params.id).then(() => {
    entry.update2().then((status) => {
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
})}).catch(() => {
    // if entry with requested id doesn't exist
    // or if current visitor is not the owner of requested entry
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(function() {
        res.redirect("/")
    })

})} else {
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
}}

exports.delete =  function(req, res) {
    Highlight.authorDelete(req.params.id, req.visitorId).then( ()  => {
         Entry.delete(req.params.id, req.visitorId).then( () => {
             Photo.delete(req.params.id).then(() => {                
                req.flash("success", "Entry successfully deleted.")
                req.session.save(() => res.redirect(`/journal/${req.session.user.username}`))
    })
    })}).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}

exports.search = function(req, res) {
    Entry.search(req.body.searchTerm).then(entries => {
        res.send(entries)
    }).catch(() => {
        res.json([])
    })
}

exports.entryList = async function(req, res) {
    await Entry.getFeed(req.params.bounds).then(entries => {
        res.send(entries)
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
