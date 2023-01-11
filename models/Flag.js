const entriesCollection = require('../db').db().collection("entries")
const flagsCollection = require('../db').db().collection("flags")
const { ObjectId } = require('mongodb')
const Entry = require('./Entry')

let Flag = function(id, authorId) {
    this.EntryId = id,
    this.authorId = authorId,
    this.errors = []
}

Flag.prototype.cleanUp = function() {
    if (typeof(this.EntryId) != "string") {this.EntryId = ""}
}

Flag.prototype.validate = async function(action) {
    //flagged entry must exist in database
    let flaggedEntry = await entriesCollection.findOne({_id: ObjectId(this.EntryId)})
    if (flaggedEntry) {
        this.flaggedEntryId = flaggedEntry._id
    } else {
        this.errors.push("You cannot flag an entry that does not exist.")
    }

    let doesFlagAlreadyExist = await flagsCollection.findOne({flaggedEntryId: this.flaggedEntryId, authorId: new ObjectId(this.authorId)})
    if (action == "create") {
        if (doesFlagAlreadyExist) {this.errors.push("You have already flagged this entry.")}
    }
    if (action == "delete") {
        if (!doesFlagAlreadyExist) {this.errors.push("You cannot unflag an entry you have not flagged.")}
    }
}


Flag.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length) {
            await flagsCollection.insertOne({flaggedEntryId: this.flaggedEntryId, authorId: new ObjectId(this.authorId), createdDate: new Date()})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Flag.hasVisitorFlagged = async function(flaggedEntryId, visitorId) {
    let flagDoc = await flagsCollection.findOne({flaggedEntryId: new ObjectId(flaggedEntryId), authorId: new ObjectId(visitorId)})
    if (flagDoc) {
        return true
    } else {
        return false
    }
}


module.exports = Flag