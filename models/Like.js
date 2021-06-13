const entriesCollection = require('../db').db().collection("entries")
const likesCollection = require('../db').db().collection("likes")
const { ObjectID } = require('mongodb').ObjectID
const Entry = require('./Entry')

let Like = function(id, authorId) {
    this.EntryId = id,
    this.authorId = authorId,
    this.errors = []
}

Like.prototype.cleanUp = function() {
    if (typeof(this.EntryId) != "string") {this.EntryId = ""}
}

Like.prototype.validate = async function(action) {
    //liked entry must exist in database
    let likedEntry = await entriesCollection.findOne({_id: ObjectID(this.EntryId)})
    if (likedEntry) {
        this.likedEntryId = likedEntry._id
    } else {
        this.errors.push("You cannot like an entry that does not exist.")
    }

    let doesLikeAlreadyExist = await likesCollection.findOne({likedEntryId: this.likedEntryId, authorId: new ObjectID(this.authorId)})
    if (action == "create") {
        if (doesLikeAlreadyExist) {this.errors.push("You have already liked this entry.")}
    }
    if (action == "delete") {
        if (!doesLikeAlreadyExist) {this.errors.push("You cannot unlike an entry you have not liked.")}
    }
}


Like.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length) {
            await likesCollection.insertOne({likedEntryId: this.likedEntryId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Like.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")
        if (!this.errors.length) {
            await likesCollection.deleteOne({likedEntryId: this.likedEntryId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Like.authorDelete = async function(likeToDelete, authorId) {
    let entry = await Entry.findSingleById(likeToDelete, authorId)
    if (entry.isVisitorOwner) {
    return new Promise(async (resolve, reject) => {
            await likesCollection.deleteMany({likedEntryId: new ObjectID(likeToDelete)})
            resolve()
    })
} else {
    reject()
}
}

Like.hasVisitorLiked = async function(likedEntryId, visitorId) {
    let likeDoc = await likesCollection.findOne({likedEntryId: new ObjectID(likedEntryId), authorId: new ObjectID(visitorId)})
    if (likeDoc) {
        return true
    } else {
        return false
    }
}

Like.getLikesById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let likes = await likesCollection.aggregate([
                {$match: {likedEntryId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            likes = likes.map(function(like) {
                let user = new User(like, true)
                return {username: like.username, avatar: user.avatar}
            })
            resolve(likes)
        } catch {
            reject()
        }
    })
}

Like.getLikedById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let liked = await likesCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: "entries", localField: "likedEntryId", foreignField: "_id", as: "entryDoc"}},
                {$project: {
                    id: {$arrayElemAt: ["$entryDoc._id", 0]},
                    title: {$arrayElemAt: ["$entryDoc.title", 0]},
                    place: {$arrayElemAt: ["$entryDoc.place", 0]},
                    date: {$arrayElemAt: ["$entryDoc.date", 0]}
                }}
            ]).toArray()
            liked = liked.map(function(liked) {
                new Entry(liked, true)
                return {title: liked.title, place: liked.place, date: liked.date, id: liked.id}
            })
            resolve(liked)
        } catch {
            reject()
        }
    })
}

Like.countLikesById = function(id) {
    return new Promise(async (resolve, reject) => {
        let likeCount = await likesCollection.countDocuments({likedEntryId: new ObjectID(id)})
        resolve(likeCount)
    })
}

Like.countLikedById = function(id) {
    return new Promise(async (resolve, reject) => {
        let count = await likesCollection.countDocuments({authorId: id})
        resolve(count)
    })
}

module.exports = Like