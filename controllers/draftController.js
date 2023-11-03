const Draft = require('../models/Draft')
const Entry = require('../models/Entry')
const GeoJSON = require('geojson')
const { Photo } = require('../models/Photo')
const billingCollection = require('../db').db().collection("billing")
const { ObjectId } = require('mongodb')



exports.viewCreateScreen = async function(req, res) {
    let billing = await billingCollection.findOne({
        explorerId:  new ObjectId(req.session.user._id),
      });
    let journeys = await Entry.findJourneysByUsername(req.session.user.username)
    res.render('create-entry', {
        pageName: 'create-entry', 
        journeys: journeys,
        plan: billing?.plan,
    })
}

exports.create = function(req, res) {
    let draft = new Draft(req.body, req.files, req.session.user._id, req.session.user.username)
    if (req.files.length) {
    let photo = new Photo(req.files)
    draft.create().then(function(newId) {
        photo.uploadPhoto(newId).then(function() {
        req.flash("success", "Draft successfully saved.")
        req.session.save(() => res.redirect(`/draft/${newId}/edit`))
    })}).catch(function(errors){
        req.flash("errors", "Error saving.")
        //errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-entry"))
    })
    } else {
    draft.create().then(function(newId) {
        req.flash("success", "Draft successfully saved.")
        req.session.save(() => res.redirect(`/draft/${newId}/edit`))
    }).catch(function(errors){
        req.flash("errors", "Error saving.")
        //errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-entry"))
    })
}
}


exports.viewSingle = async function(req, res) {
    try {
        let billing = await billingCollection.findOne({
            explorerId:  new ObjectId(req.session.user._id),
          });
        let draft = await Draft.findSingleById(req.params.id, req.visitorId)
        res.render('single-draft', {draft: draft, pageName: draft, plan: billing?.plan})
    } catch {
        res.render('pages-404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
      let draft = await Draft.findSingleById(req.params.id, req.visitorId)
      let journeys = await Draft.findJourneysByUsername(req.session.user.username)
      let billing = await billingCollection.findOne({explorerId:  new ObjectId(req.session.user._id),})
      let entryMarker = GeoJSON.parse(draft.GeoJSONcoordinates, {'Point': ['draft.GeoJSONcoordinates.coordinates[0]','draft.GeoJSONcoordinates.coordinates[1]']})
      if (draft.isVisitorOwner) {
        res.render("edit-draft", {draft: draft, journeys: journeys, entrymarker: JSON.stringify(entryMarker), pageName: "edit-draft", plan: billing?.plan})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }

exports.edit = function(req, res) {
    let draft = new Draft(req.body, req.files, req.visitorId, req.session.user.username, req.params.id)
        if (req.files.length) {
            Photo.delete(req.params.id).then(() => {
            let photo = new Photo(req.files)
            photo.uploadPhoto(req.params.id).then(() => {
                draft.update2().then((status) => {
        // the draft was successfully updated in the database
        // or user did have permission, but there were validation errors
        if (status == "success") {
            // entry was updated in db
            req.flash("success", "Draft successfully updated.")
            req.session.save(function() {
                res.redirect(`/draft/${req.params.id}/edit`)
            })
        } else {
            draft.errors.forEach(function(error) {
                req.flash("errors", error)
            })
            req.session.save(function() {
                res.redirect(`/draft/${req.params.id}/edit`)
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
    draft.update2().then((status) => {
    // the draft was successfully updated in the database
    // or user did have permission, but there were validation errors
    if (status == "success") {
        // entry was updated in db
        req.flash("success", "Draft successfully updated.")
        req.session.save(function() {
            res.redirect(`/draft/${req.params.id}/edit`)
        })
    } else {
        draft.errors.forEach(function(error) {
            req.flash("errors", error)
        })
        req.session.save(function() {
            res.redirect(`/draft/${req.params.id}/edit`)
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
        draft.errors.forEach(function(error) {
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
}}

exports.delete = function(req, res) {
    Draft.delete(req.params.id, req.visitorId).then(() => {
        Photo.delete(req.params.id)
        req.flash("success", "Draft successfully deleted.")
        req.session.save(() => res.redirect(`/journal/${req.session.user.username}`))
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}



exports.postEntry = async function(req, res) {
    let draft = await Draft.findSingleById(req.params.id, req.visitorId)
    let draftId = req.params.id
    let entry = new Entry(req.body, req.files, draftId, req.session.user._id, req.session.user.username)
    if (req.files.length) {
    let photo = new Photo(req.files)
    entry.create().then(function(newId) {
        photo.uploadPhoto(newId).then(function() {
        Draft.delete(draftId, req.session.user._id)
        req.flash("success", "Entry successfully posted.")
        req.session.save(() => res.redirect(`/entry/${newId}`))
    })}).catch(function(errors){
        req.flash("errors", "Error posting.")
        //errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect(`/draft/${req.params.id}/edit`))
    })
    } else if (draft.hasPhoto) {
        console.log('has photo')
    let entry2 = new Entry(req.body, 'hasPhoto', draftId, req.session.user._id, req.session.user.username)
    entry2.create().then(function(newId) {
            Draft.delete(draftId, req.session.user._id)
            req.flash("success", "Entry successfully posted.")
            req.session.save(() => res.redirect(`/entry/${newId}`))
    }).catch(function(errors){
        req.flash("errors", "Error posting.")
        //errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect(`/draft/${req.params.id}/edit`))
    })
} else {
    console.log('no photo')
    entry.create().then(function(newId) {
        Draft.delete(draftId, req.session.user._id)
        req.flash("success", "Entry successfully posted.")
        req.session.save(() => res.redirect(`/entry/${newId}`))
}).catch(function(errors){
    req.flash("errors", "Error posting.")
    //errors.forEach(error => req.flash("errors", error))
    req.session.save(() => res.redirect(`/draft/${req.params.id}/edit`))
})
}
}