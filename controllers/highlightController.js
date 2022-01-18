const { NoEmitOnErrorsPlugin } = require('webpack')
const Highlight = require('../models/Highlight')
const Entry = require('../models/Entry')
const User = require('../models/User')
const io = require('socket.io')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.addHighlight = async function(req, res) {
    let highlight = new Highlight(req.params.id, req.visitorId)
    let entry = await Entry.findSingleById(req.params.id)
    highlight.create().then(() => {
        req.session.save(async () => {
            let entryOwner = await User.findByUsername(entry.author.username)
            let likeOwner = await User.findByUsername(req.session.user.username)
            if (entryOwner.settings.emailNotifications.likes == "true") {
                sendgrid.send({
                    to: `${entryOwner.email}`,
                    from: 'admin@heimursaga.com',
                    subject: `Your entry "${entry.title}" has a new like!`,
                    text: `Hello, ${likeOwner.username} has liked "${entry.title}"! Visit your entry at https://heimursaga.com/entry/${entry._id}.`,
                    html: `Hello, <a href="https://heimursaga.com/journal/${likeOwner.username}">${likeOwner.username}</a> has liked <a href="https://heimursaga.com/entry/${entry._id}">${entry.title}</a> on Heimursaga!`
                })
            }
        })
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}

exports.removeHighlight = function(req, res) {
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