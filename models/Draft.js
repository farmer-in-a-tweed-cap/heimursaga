const draftsCollection = require('../db').db().collection("drafts")
const followsCollection = require('../db').db().collection("follows")
const usersCollection = require('../db').db().collection("users")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')


let Draft = function(data, userid, username, requestedDraftId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedDraftId = requestedDraftId
  this.username = username
}

Draft.prototype.cleanUp = function() {
  if (typeof(this.data.title) != "string") {this.data.title = ""}
  if (typeof(this.data.place) != "string") {this.data.place = ""}
  if (typeof(this.data.body) != "string") {this.data.body = ""}

  coordinatesString = sanitizeHTML(this.data.lnglatcoordinates.trim(), {allowedTags: [], allowedAttributes: {}}),
  coordinates = coordinatesString.split(',').map(Number)
  

  // get rid of any bogus properties
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
    place: sanitizeHTML(this.data.place.trim(), {allowedTags: [], allowedAttributes: {}}),
    date: sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}}),
    body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
    GeoJSONcoordinates: {type: "Point", coordinates: [coordinates[0],coordinates[1]]},
    createdDate: new Date(),
    author: ObjectID(this.userid),
  }
}

Draft.prototype.validate = function() {
  if (this.data.title == "") {this.errors.push("You must provide a title.")}
  if (this.data.place == "") {this.errors.push("You must provide a place.")}
  if (this.data.body == "") {this.errors.push("You must provide content.")}
  if (coordinates == 0) {this.errors.push("You must log coordinates.")}
}

Draft.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save draft into database
      draftsCollection.insertOne(this.data).then((info) => {
        resolve(info.ops[0]._id)
      }).catch(() => {
        this.errors.push("Please try again later.")
        reject(this.errors)
      })
    } else {
      reject(this.errors)
    }
  })
}

Draft.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let draft = await Draft.findSingleById(this.requestedDraftId, this.userid)
      if (draft.isVisitorOwner) {
        // actually update the db
        let status = await this.actuallyUpdate()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Draft.prototype.actuallyUpdate = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await draftsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedDraftId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, body: this.data.body, data: this.data.date}})
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Draft.reusableDraftQuery = function(uniqueOperations, visitorId, finalOperations = []) {
  return new Promise(async function(resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        title: 1,
        place: 1,
        date: 1,
        GeoJSONcoordinates: 1,
        body: 1,
        popup: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]}
      }}
    ]).concat(finalOperations)

    let drafts = await draftsCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    drafts = drafts.map(function(draft) {
      draft.isVisitorOwner = draft.authorId.equals(visitorId)
      draft.authorId = undefined

      draft.author = {
        username: draft.author.username,
        avatar: new User(draft.author, true).avatar
      }

      return draft
    })

    resolve(drafts)
  })
}



Draft.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !ObjectID.isValid(id)) {
      reject()
      return
    }
    
    let drafts = await Draft.reusableDraftQuery([
      {$match: {_id: new ObjectID(id)}}
    ], visitorId)

    if (drafts.length) {
      console.log(drafts[0])
      resolve(drafts[0])
    } else {
      reject()
    }
  })
}

Draft.findByAuthorId = function(authorId) {
  return Draft.reusableDraftQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

Draft.delete = function(draftIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let draft = await Draft.findSingleById(draftIdToDelete, currentUserId)
      if (draft.isVisitorOwner) {
        await draftsCollection.deleteOne({_id: new ObjectID(draftIdToDelete)})
        resolve()
      } else {
        reject()
      }    
    } catch {
      reject()
    }
  })
}

Draft.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) == "string") {
      let drafts = await Draft.reusableDraftQuery([
        {$match: {$text: {$search: searchTerm}}}
      ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
      resolve(drafts)
    } else { 
      reject()
    }
  })
}

Draft.countDraftsByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let draftCount = await draftsCollection.countDocuments({author: id})
    resolve(draftCount)
  })
}

Draft.getFeed = async function() {
  return Draft.reusableDraftQuery([
    {$sort: {createdDate: -1}}
  ])
}

Draft.returnAll = function() {
  return new Promise(async function(resolve,reject) {
    let drafts = draftsCollection.find({}).sort({createdDate: -1}).toArray()
    //let users = usersCollection.find({}).toArray()
    resolve(drafts)
  })
  
}

module.exports = Draft