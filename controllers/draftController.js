const Draft = require('../models/Draft')


exports.viewCreateScreen = function(req, res) {
    res.render('create-entry', {pageName: 'create-entry'})
}

exports.create = function(req, res) {
    let draft = new Draft(req.body, req.session.user._id)
    draft.create().then(function(newId) {
        req.flash("success", "Draft successfully saved.")
        req.session.save(() => res.redirect(`/journal/${req.session.user.username}`))
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
      if (draft.isVisitorOwner) {
        res.render("edit-draft", {draft: draft, pageName: "edit-draft"})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }

exports.edit = function(req, res) {
    let draft = new Draft(req.body, req.visitorId, req.params.id)
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

exports.search = function(req, res) {
    Entry.search(req.body.searchTerm).then(entries => {
        res.json(entries)
    }).catch(() => {
        res.json([])
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
