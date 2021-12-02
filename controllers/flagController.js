const { NoEmitOnErrorsPlugin } = require('webpack')
const Flag = require('../models/Flag')
const Entry = require('../models/Entry')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)


exports.viewSingleFlags = async function(req, res) {
    try {
        let entry = await Entry.findSingleById(req.params.id, req.visitorId)
        let hasVisitorFlagged = await Flag.hasVisitorFlagged(req.params.id, req.visitorId)
        res.render('flag-button', {entry: entry, pageName: "flag-button", hasVisitorFlagged: hasVisitorFlagged})
    } catch {
        res.render('404')
    }
}


exports.addFlag = function(req, res) {
    let flag = new Flag(req.params.id, req.visitorId)
    flag.create().then(() => {
        sendgrid.send({
            to: 'admin@heimursaga.com',
            from: 'admin@heimursaga.com',
            subject: `Entry reported!`,
            text: `An entry has been reported. Please review: https://heimursaga.com/entry/${req.params.id}`,
            html: `An entry has been reported. Please review: https://heimursaga.com/entry/${req.params.id}`
        })
        req.session.save(() => res.redirect(`/single-entry-flags/${req.params.id}`))
    }).catch((errors) => {
        errors.forEach(error => {
            req.flash("errors", error)
        })
        req.session.save(() => res.redirect('/'))
    })
}


