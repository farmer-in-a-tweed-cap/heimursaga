const Draft = require('../models/Draft')
const Entry = require('../models/Entry')
const GeoJSON = require('geojson')


exports.viewCreateScreen = function(req, res) {
    res.render('create-entry', {pageName: 'create-entry'})
}

exports.create = function(req, res) {
    let draft = new Draft(req.body, req.session.user._id)
    draft.create().then(function(newId) {
        req.flash("success", "Draft successfully saved.")
        req.session.save(() => res.redirect(`/draft/${newId}/edit`))
    }).catch(function(errors){
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-entry"))
    })
}


exports.viewSingle = async function(req, res) {
    try {
        let draft = await Draft.findSingleById(req.params.id, req.visitorId)
        res.render('single-draft', {draft: draft, pageName: draft})
    } catch {
        res.render('pages-404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
      let draft = await Draft.findSingleById(req.params.id, req.visitorId)
      let entryMarker = GeoJSON.parse(draft.GeoJSONcoordinates, {'Point': ['draft.GeoJSONcoordinates.coordinates[0]','draft.GeoJSONcoordinates.coordinates[1]']})
      if (draft.isVisitorOwner) {
        res.render("edit-draft", {draft: draft, entrymarker: JSON.stringify(entryMarker), pageName: "edit-draft"})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }

exports.edit = function(req, res) {
    let draft = new Draft(req.body, req.visitorId, req.session.user.username, req.params.id)
    console.log(draft)
    draft.update().then((status) => {
        // the entry was successfully updated in the database
        // or user did have permission, but there were validation errors
        if (status == "success") {
            // entry was updated in db
            req.flash("success", "Draft successfully updated.")
            req.session.save(function() {
                res.redirect(`/draft/${req.params.id}/edit`)
            })
        } else {
            entry.errors.forEach(function(error) {
                req.flash("errors", error)
            })
            req.session.save(function() {
                res.redirect(`/draft/${req.params.id}/edit`)
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
    Draft.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success", "Draft successfully deleted.")
        req.session.save(() => res.redirect(`/journal/${req.session.user.username}`))
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}

exports.postEntry = function(req, res) {
    let draftId = req.params.id
    let entry = new Entry(req.body, req.session.user._id, req.session.user.username)
    entry.create().then(function(newId) {
        Draft.delete(draftId, req.session.user._id)
        req.flash("success", "Entry successfully posted.")
        req.session.save(() => res.redirect(`/entry/${newId}`))
    }).catch(function(errors){
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect(`/draft/${req.params.id}/edit`))
    })
}