const { NoEmitOnErrorsPlugin } = require('webpack')
const Bookmark = require('../models/Bookmark')
const Entry = require('../models/Entry')
const User = require('../models/User')
const io = require('socket.io')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.addBookmark = async function(req, res) {
    let bookmark = new Bookmark(req.params.id, req.visitorId)
    let entry = await Entry.findSingleById(req.params.id)
    bookmark.create().then(() => {
        req.session.save()
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}

exports.removeBookmark = function(req, res) {
    let bookmark = new Bookmark(req.params.id, req.visitorId)
    bookmark.delete().then(() => {
        req.session.save()
    }).catch((errors) => {
        errors.forEach(error => {
            return error
        })
    })
}

exports.bookmarkCount = async function(req, res) {
    let bookmarkCount = await Bookmark.countBookmarksById(req.params.id, req.visitorId).then((result) => {
        console.log(result)
        return result
    })
}