const Notification = require('../models/Notification')

exports.addSponsorNotification = async function(req, res) {
    let notification = new Notification("sponsor", [req.params.amount, req.params.type], req.session.user.username, req.params.username)
    notification.create().then(() => {
        req.session.save()
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}