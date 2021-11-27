const { NoEmitOnErrorsPlugin } = require('webpack')
const Like = require('../models/Like')
const Entry = require('../models/Entry')
const User = require('../models/User')
const io = require('socket.io')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.addLike = async function(req, res) {
    let like = new Like(req.params.id, req.visitorId)
    let entry = await Entry.findSingleById(req.params.id)
    like.create().then(() => {
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

exports.removeLike = function(req, res) {
    let like = new Like(req.params.id, req.visitorId)
    like.delete().then(() => {
        req.session.save()
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}

exports.likeCount = async function(req, res) {
    console.log(req.params.id)
    console.log(req.visitorId)
    let likeCount = await Like.countLikesById(req.params.id, req.visitorId).then((result) => {
        console.log(result)
        return result
    })
}