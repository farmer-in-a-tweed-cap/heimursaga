const { NoEmitOnErrorsPlugin } = require('webpack')
const Like = require('../models/Like')

exports.addLike = function(req, res) {
    let like = new Like(req.params.id, req.visitorId)
    like.create().then(() => {
        req.session.save(() => res.redirect(`/single-entry-likes/${req.params.id}`))
    }).catch((errors) => {
        errors.forEach(error => {
            req.flash("errors", error)
        })
        req.session.save(() => res.redirect('/'))
    })
}

exports.removeLike = function(req, res) {
    let like = new Like(req.params.id, req.visitorId)
    like.delete().then(() => {
        req.session.save(() => res.redirect(`/single-entry-likes/${req.params.id}`))
    }).catch((errors) => {
        errors.forEach(error => {
            req.flash("errors", error)
        })
        req.session.save(() => res.redirect('/'))
    })
}