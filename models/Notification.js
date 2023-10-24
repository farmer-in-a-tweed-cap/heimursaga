const notificationsCollection = require('../db').db().collection("notifications")

let Notification = function(type, action, actor, notifier) {
    this.type = type
    this.action = action
    this.actor = actor
    this.notifier = notifier
    this.errors = []
}

Notification.prototype.create = async function() {
    let doesNotificationExist = await notificationsCollection.findOne({type: this.type, action: this.action, actor: this.actor, notifier: this.notifier})
    return new Promise((resolve, reject) => {
        if (!doesNotificationExist) {
        notificationsCollection.insertOne({
            createdDate: new Date(), 
            type: this.type, 
            action: this.action, 
            actor: this.actor, 
            notifier: this.notifier, 
            isRead: false
        })
        resolve()
    } else {
        reject()
    }
})
}

Notification.prototype.delete = async function() {
    return new Promise((resolve, reject) => {
        notificationsCollection.insertOne({
            createdDate: new Date(), 
            type: this.type, 
            action: this.action, 
            actor: this.actor, 
            notifier: this.notifier, 
            isRead: false
        }).then((info) => {
            resolve(info.insertedId)
        }).catch(() => {
        reject()
    })
})
}

Notification.getNotificationsByUser = function(username) {
    return new Promise(async (resolve, reject) => {
        let notifications = await notificationsCollection.find({notifier: username}).sort({createdDate: -1}).toArray()
        resolve(notifications)
    })
}

Notification.markNotificationsAsRead = function(username) {
    return new Promise(async (resolve, reject) => {
        let notifications = await notificationsCollection.updateMany({notifier: username}, {$set: {isRead: true}})
        resolve(notifications)
    })
}

module.exports = Notification