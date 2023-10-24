const { NoEmitOnErrorsPlugin } = require('webpack')
const Follow = require('../models/Follow')
const User = require('../models/User')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)
const axios = require('axios')
const csrf = require('csurf')
const Notification = require('../models/Notification')


exports.addFollow = async function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    let followedUser = await User.findByUsername(req.params.username)
    let user = await User.findByUsername(req.session.user.username)
    let notification = new Notification("follow", "", req.session.user.username, req.params.username)
    follow.create().then(() => {
        notification.create()
        req.flash("success", `Successfully followed ${req.params.username}`)
        req.session.save(() => res.redirect(`/journal/${req.params.username}`))

        if (followedUser.settings.emailNotifications.followers == "true") {
        sendgrid.send({
            to: `${followedUser.email}`,
            from: 'admin@heimursaga.com',
            subject: `You have a new follower!`,
            text: `Hello, ${user.username} has followed you on Heimursaga. Visit their Journal (https://heimursaga.com/journal/${user.username}) to see their travels!`,
            html: `Hello, <strong>${user.username}</strong> has followed you on Heimursaga. <br><br>Visit their <a href="https://heimursaga.com/journal/${user.username}">Journal</a> to see their travels!`
        })}
    }).catch(() => {
        errors.forEach(error => {
            req.flash("errors", error)
        })
        req.session.save(() => res.redirect('/'))
    })
}


exports.removeFollow = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    follow.delete().then(() => {
        req.flash("success", `Successfully stopped following ${req.params.username}`)
        req.session.save(() => res.redirect(`/journal/${req.params.username}`))
    }).catch(() => {
        errors.forEach(error => {
            req.flash("errors", error)
        })
        req.session.save(() => res.redirect('/'))
    })
}