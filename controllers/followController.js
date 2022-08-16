const { NoEmitOnErrorsPlugin } = require('webpack')
const Follow = require('../models/Follow')
const User = require('../models/User')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)
const axios = require('axios')
const csrf = require('csurf')


/*exports.addFollow = async function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    let followedUser = await User.findByUsername(req.params.username)
    let user = await User.findByUsername(req.session.user.username)
    follow.create().then(() => {
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
}*/

exports.addFollow = async function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    let followedUser = await User.findByUsername(req.params.username)
    let user = await User.findByUsername(req.session.user.username)
    console.log(followedUser.email)

    follow.create().then(() => {
        req.session.save(async () => {
            if (followedUser.settings.emailNotifications.followers == "true") {
                sendgrid.send({
                    to: `${followedUser.email}`,
                    from: 'admin@heimursaga.com',
                    subject: `You have a new follower!`,
                    text: `Hello, ${user.username} has followed you on Heimursaga. Visit their Journal (https://heimursaga.com/journal/${user.username}) to see their travels!`,
                    html: `Hello, <strong>${user.username}</strong> has followed you on Heimursaga. <br><br>Visit their <a href="https://heimursaga.com/journal/${user.username}">Journal</a> to see their travels!`
                })
            }  if (followedUser.settings.pushNotifications.followers == "true") {

                axios({
                    method: 'post',
                    url: "https://progressier.com/push/send",
                    data: {
                        "recipients": {"email": `${followedUser.email}`},
                        "campaigns": [],
                        "title": "Heimursaga Admin",
                        "body": `Hello, ${user.username} has followed you on Heimursaga!`,
                        "url": `https://heimursaga.com/journal/${user.username}`,
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