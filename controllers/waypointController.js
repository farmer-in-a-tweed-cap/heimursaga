const Waypoint = require('../models/Waypoint')
const { ObjectId } = require('mongodb')




exports.create = function(req, res) {
    let waypoint = new Waypoint(req.body, ObjectId(), req.session.user._id, req.session.user.username)
    let journey = req.body.journeyname

    waypoint.create().then(function(newId) {
        req.flash("success", "New waypoint successfully posted.")
        req.session.save(() => res.redirect(`/journal/${req.session.user.username}/${journey}`))
    }).catch(function(errors) {
        req.flash("errors", "Error posting.")
        req.session.save(() => res.redirect("/create-entry"))
    })
}

exports.delete =  function(req, res) {
         Waypoint.delete(req.params.id, req.visitorId).then( () => {
                req.flash("success", "Waypoint successfully deleted.")
                req.session.save(() => res.redirect(`/journal/${req.session.user.username}/${req.params.journey}`))
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}