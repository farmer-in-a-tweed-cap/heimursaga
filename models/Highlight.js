const entriesCollection = require('../db').db().collection("entries")
const likesCollection = require('../db').db().collection("likes")
const { ObjectID } = require('mongodb').ObjectID
const Entry = require('./Entry')
const highlightsCollection = require('../db').db().collection("highlights")



let Highlight = function(id, authorId) {
    this.EntryId = id,
    this.authorId = authorId,
    this.errors = []
}

Highlight.prototype.cleanUp = function() {
    if (typeof(this.EntryId) != "string") {this.EntryId = ""}
}

Highlight.prototype.validate = async function(action) {
    //highlighted entry must exist in database
    let highlightedEntry = await entriesCollection.findOne({_id: ObjectID(this.EntryId)})
    if (highlightedEntry) {
        this.highlightedEntryId = highlightedEntry._id
    } else {
        this.errors.push("You cannot highlight an entry that does not exist.")
    }

    let doesHighlightAlreadyExist = await highlightsCollection.findOne({highlightedEntryId: this.highlightedEntryId, authorId: new ObjectID(this.authorId)})
    if (action == "create") {
        if (doesHighlightAlreadyExist) {this.errors.push("You have already highlighted this entry.")}
    }
    if (action == "delete") {
        if (!doesHighlightAlreadyExist) {this.errors.push("You cannot un-highlight an entry you have not highlighted.")}
    }
}


Highlight.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length) {
            await highlightsCollection.insertOne({highlightedEntryId: this.highlightedEntryId, authorId: new ObjectID(this.authorId), createdDate: new Date()})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Highlight.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")
        if (!this.errors.length) {
            await highlightsCollection.deleteOne({highlightedEntryId: this.highlightedEntryId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Highlight.authorDelete = async function(highlightToDelete, authorId) {
    let entry = await Entry.findSingleById(highlightToDelete, authorId)
    if (entry.isVisitorOwner) {
    return new Promise(async (resolve, reject) => {
            await highlightsCollection.deleteMany({highlightedEntryId: new ObjectID(highlightToDelete)})
            resolve()
    })
} else {
    reject()
}
}

Highlight.hasVisitorHighlighted= async function(highlightedEntryId, visitorId) {
    let highlightDoc = await highlightsCollection.findOne({highlightedEntryId: new ObjectID(highlightedEntryId), authorId: new ObjectID(visitorId)})
    if (highlightDoc) {
        return true
    } else {
        return false
    }
}

Highlight.getHighlightsById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let highlights = await highlightsCollection.aggregate([
                {$match: {highlightedEntryId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            highlights = highlights.map(function(highlight) {
                let user = new User(highlight, true)
                return {username: highlight.username, avatar: user.avatar}
            })
            resolve(highlights)
        } catch {
            reject()
        }
    })
}

Highlight.getHighlightedById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let highlighted = await highlightsCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: "entries", localField: "highlightedEntryId", foreignField: "_id", as: "entryDoc"}},
                {$project: {
                    id: {$arrayElemAt: ["$entryDoc._id", 0]},
                    title: {$arrayElemAt: ["$entryDoc.title", 0]},
                    place: {$arrayElemAt: ["$entryDoc.place", 0]},
                    date: {$arrayElemAt: ["$entryDoc.date", 0]}
                }}
            ]).toArray()
            highlighted = highlighted.map(function(highlighted) {
                new Entry(highlighted, true)
                return {title: highlighted.title, place: highlighted.place, date: highlighted.date, id: highlighted.id}
            })
            resolve(highlighted)
        } catch {
            reject()
        }
    })
}

Highlight.countHighlightsById = function(id) {
    return new Promise(async (resolve, reject) => {
        let highlightCount = await highlightsCollection.countDocuments({highlightedEntryId: new ObjectID(id)})
        resolve(highlightCount)
    })
}

Highlight.countHighlightedById = function(id) {
    return new Promise(async (resolve, reject) => {
        let count = await highlightsCollection.countDocuments({authorId: id})
        resolve(count)
    })
}

module.exports = Highlight