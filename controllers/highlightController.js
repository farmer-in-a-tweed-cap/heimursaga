const { NoEmitOnErrorsPlugin } = require('webpack')
const Highlight = require('../models/Highlight')
const Entry = require('../models/Entry')
const User = require('../models/User')
const io = require('socket.io')
const sendgrid = require('@sendgrid/mail')
const axios = require('axios')
const csrf = require('csurf')
const Notification = require('../models/Notification')
const { ObjectId } = require('mongodb')

sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)


exports.addHighlight = async function(req, res) {
    let highlight = new Highlight(req.params.id, req.visitorId)
    let entry = await Entry.findSingleById(req.params.id)
    highlight.create().then(() => {
        req.session.save(async () => {
            let notification = new Notification("highlight", [entry.title, new ObjectId(req.params.id)], req.session.user.username, entry.author.username)
            let entryOwner = await User.findByUsername(entry.author.username)
            let highlightOwner = await User.findByUsername(req.session.user.username)
            notification.create()
            if (entryOwner.settings.emailNotifications.likes == "true") {
                sendgrid.send({
                    to: `${entryOwner.email}`,
                    from: 'admin@heimursaga.com',
                    subject: `Your entry "${entry.title}" has a new highlight!`,
                    text: `Hello, ${highlightOwner.username} has highlighted "${entry.title}"! Visit your entry at https://heimursaga.com/entry/${entry._id}.`,
                    html: `Hello, <a href="https://heimursaga.com/journal/${highlightOwner.username}">${highlightOwner.username}</a> has highlighted <a href="https://heimursaga.com/entry/${entry._id}">${entry.title}</a> on Heimursaga!`
                }).then((response) => {
                    console.log(response);
                  }, (error) => {
                    console.log(error);
                  })

            }
        })
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}

exports.removeHighlight = async function(req, res) {
    let highlight = new Highlight(req.params.id, req.visitorId)
    highlight.delete().then(() => {
        req.session.save()
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}

exports.highlightCount = async function(req, res) {
    let highlightCount = await Highlight.countHighlightsById(req.params.id, req.visitorId).then((result) => {
        console.log(result)
        return result
    })
}