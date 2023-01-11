const entriesCollection = require('../db').db().collection("entries")
const bookmarksCollection = require('../db').db().collection("bookmarks")
const { ObjectId } = require('mongodb')
const Entry = require('./Entry')



let Bookmark = function(id, authorId) {
    this.EntryId = id,
    this.authorId = authorId,
    this.errors = []
}

Bookmark.prototype.cleanUp = function() {
    if (typeof(this.EntryId) != "string") {this.EntryId = ""}
}

Bookmark.prototype.validate = async function(action) {
    //bookmarked entry must exist in database
    let bookmarkedEntry = await entriesCollection.findOne({_id: ObjectId(this.EntryId)})
    if (bookmarkedEntry) {
        this.bookmarkedEntryId = bookmarkedEntry._id
    } else {
        this.errors.push("You cannot bookmark an entry that does not exist.")
    }

    let doesBookmarkAlreadyExist = await bookmarksCollection.findOne({bookmarkedEntryId: this.bookmarkedEntryId, authorId: new ObjectId(this.authorId)})
    if (action == "create") {
        if (doesBookmarkAlreadyExist) {this.errors.push("You have already bookmarked this entry.")}
    }
    if (action == "delete") {
        if (!doesBookmarkAlreadyExist) {this.errors.push("You cannot un-bookmark an entry you have not bookmarked.")}
    }
}


Bookmark.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length) {
            await bookmarksCollection.insertOne({bookmarkedEntryId: this.bookmarkedEntryId, authorId: new ObjectId(this.authorId), createdDate: new Date()})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Bookmark.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")
        if (!this.errors.length) {
            await bookmarksCollection.deleteOne({bookmarkedEntryId: this.bookmarkedEntryId, authorId: new ObjectId(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Bookmark.authorDelete = async function(bookmarkToDelete, authorId) {
    let entry = await Entry.findSingleById(bookmarkToDelete, authorId)
    if (entry.isVisitorOwner) {
    return new Promise(async (resolve, reject) => {
            await bookmarksCollection.deleteMany({bookmarkedEntryId: new ObjectId(bookmarkToDelete)})
            resolve()
    })
} else {
    reject()
}
}

Bookmark.hasVisitorBookmarked = async function(bookmarkedEntryId, visitorId) {
    let bookmarkDoc = await bookmarksCollection.findOne({bookmarkedEntryId: new ObjectId(bookmarkedEntryId), authorId: new ObjectId(visitorId)})
    if (bookmarkDoc) {
        return true
    } else {
        return false
    }
}

Bookmark.getBookmarksById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let bookmarks = await bookmarksCollection.aggregate([
                {$match: {bookmarkedEntryId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            bookmarks = bookmarks.map(function(bookmark) {
                let user = new User(bookmark, true)
                return {username: bookmark.username, avatar: user.avatar}
            })
            resolve(bookmarks)
        } catch {
            reject()
        }
    })
}

Bookmark.getBookmarkedById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let bookmarked = await bookmarksCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: "entries", localField: "bookmarkedEntryId", foreignField: "_id", as: "entryDoc"}},
                {$project: {
                    id: {$arrayElemAt: ["$entryDoc._id", 0]},
                    title: {$arrayElemAt: ["$entryDoc.title", 0]},
                    place: {$arrayElemAt: ["$entryDoc.place", 0]},
                    date: {$arrayElemAt: ["$entryDoc.date", 0]}
                }}
            ]).toArray()
            bookmarked = bookmarked.map(function(bookmarked) {
                new Entry(bookmarked, true)
                return {title: bookmarked.title, place: bookmarked.place, date: bookmarked.date, id: bookmarked.id}
            })
            resolve(bookmarked)
        } catch {
            reject()
        }
    })
}

Bookmark.countBookmarksById = function(id) {
    return new Promise(async (resolve, reject) => {
        let bookmarkCount = await bookmarksCollection.countDocuments({bookmarkedEntryId: new ObjectId(id)})
        resolve(bookmarkCount)
    })
}

Bookmark.countBookmarkedById = function(id) {
    return new Promise(async (resolve, reject) => {
        let count = await bookmarksCollection.countDocuments({authorId: id})
        resolve(count)
    })
}

module.exports = Bookmark