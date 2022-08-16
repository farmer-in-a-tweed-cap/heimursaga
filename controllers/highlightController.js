const { NoEmitOnErrorsPlugin } = require('webpack')
const Highlight = require('../models/Highlight')
const Entry = require('../models/Entry')
const User = require('../models/User')
const io = require('socket.io')
const sendgrid = require('@sendgrid/mail')
const axios = require('axios')
const csrf = require('csurf')

sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)


exports.addHighlight = async function(req, res) {
    let highlight = new Highlight(req.params.id, req.visitorId)
    let entry = await Entry.findSingleById(req.params.id)
    highlight.create().then(() => {
        req.session.save(async () => {


            
            let entryOwner = await User.findByUsername(entry.author.username)
            let highlightOwner = await User.findByUsername(req.session.user.username)
            if (entryOwner.settings.emailNotifications.likes == "true") {
                sendgrid.send({
                    to: `${entryOwner.email}`,
                    from: 'admin@heimursaga.com',
                    subject: `Your entry "${entry.title}" has a new highlight!`,
                    text: `Hello, ${highlightOwner.username} has highlighted "${entry.title}"! Visit your entry at https://heimursaga.com/entry/${entry._id}.`,
                    html: `Hello, <a href="https://heimursaga.com/journal/${highlightOwner.username}">${highlightOwner.username}</a> has highlighted <a href="https://heimursaga.com/entry/${entry._id}">${entry.title}</a> on Heimursaga!`
                })
            } if (entryOwner.settings.pushNotifications.likes == "true") {

                axios({
                    method: 'post',
                    url: "https://progressier.com/push/send",
                    data: {
                        "recipients": {"email": `${entryOwner.email}`},
                        "campaigns": ["user activity notifications"],
                        "title": "Heimursaga Admin",
                        "body": `Hello, ${highlightOwner.username} has highlighted "${entry.title}" on Heimursaga!`,
                        "url": `https://heimursaga.com/entry/${entry._id}`,
                        "badge": "https://firebasestorage.googleapis.com/v0/b/pwaa-8d87e.appspot.com/o/x5BC5jXNQTEvdfTutjGr%2FIeujfSdnTBeJxKb.png?alt=media&token=8046c514-5d5e-4a2f-a8f8-33c45f5112b6",
                        "icon": "https://firebasestorage.googleapis.com/v0/b/pwaa-8d87e.appspot.com/o/x5BC5jXNQTEvdfTutjGr%2FspmHBGpeHpIeQhq.png?alt=media&token=3198025c-e988-485e-83cc-3dfd0bba7025",
                    },
                    headers: {
                        "authorization": "Bearer 9zay5vfzh8vsu2lpea1c0w7pvj4jxdn221y9suiirkzvhc84e6th2zbpi65ia89n",
                        "content-type": "application/json",
                        "x-csrf-token": req.csrfToken()
                    }
                  })
                  .then((response) => {
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