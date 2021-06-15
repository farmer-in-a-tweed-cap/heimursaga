const { NoEmitOnErrorsPlugin } = require('webpack')
const Flag = require('../models/Flag')

exports.addFlag = function(req, res) {
    let flag = new Flag(req.params.id, req.visitorId)
    flag.create().then(() => {
        req.session.save(() => res.redirect(`/single-entry-flags/${req.params.id}`))
    }).catch((errors) => {
        errors.forEach(error => {
            req.flash("errors", error)
        })
        req.session.save(() => res.redirect('/'))
    })
}
