const draftsCollection = require('../db').db().collection("drafts")
const entriesCollection = require('../db').db().collection("entries")
const followsCollection = require('../db').db().collection("follows")
const usersCollection = require('../db').db().collection("users")
const { ObjectId } = require('mongodb')
const User = require('./User')
const sanitizeHTML = require('sanitize-html')


let Draft = function(data, photo, userid, username, requestedDraftId) {
  this.data = data
  this.photo = photo
  this.errors = []
  this.userid = userid
  this.requestedDraftId = requestedDraftId
  this.username = username
}

Draft.prototype.cleanUp = function() {
  if (typeof(this.data.title) != "string") {this.data.title = ""}
  if (typeof(this.data.place) != "string") {this.data.place = ""}
  if (typeof(this.data.body) != "string") {this.data.body = ""}
  if (typeof(this.data.journeyname) != "string") {this.data.journeyname = ""}

  coordinatesString = sanitizeHTML(this.data.lnglatcoordinates.trim(), {allowedTags: [], allowedAttributes: {}}),
  coordinates = coordinatesString.split(',').map(Number)
  
  if (this.photo.length) {this.photo = true} else {this.photo = false}

  if (this.data.journeyname == "") {
    this.data = {
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
      place: sanitizeHTML(this.data.place.trim(), {allowedTags: [], allowedAttributes: {}}),
      date: sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}}),
      body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
      GeoJSONcoordinates: {type: "Point", coordinates: [coordinates[0],coordinates[1]]},
      createdDate: new Date(),
      author: ObjectId(this.userid),
      authorUsername: this.username,
      hasPhoto: this.photo,
      privacy: this.data.flexRadioDefault
    }

  } else {
    this.data = {
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
      place: sanitizeHTML(this.data.place.trim(), {allowedTags: [], allowedAttributes: {}}),
      date: sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}}),
      body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
      journey: sanitizeHTML(this.data.journeyname.trim(), {allowedTags: [], allowedAttributes: {}}),
      GeoJSONcoordinates: {type: "Point", coordinates: [coordinates[0],coordinates[1]]},
      createdDate: new Date(),
      author: ObjectId(this.userid),
      authorUsername: this.username,
      hasPhoto: this.photo,
      privacy: this.data.flexRadioDefault
    }

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
        resolve(info.insertedId)
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
      if (this.data.journey == "REMOVE JOURNEY") {
        await draftsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedDraftId)}, {$unset: {journey: ""}}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, privacy: this.data.privacy}})
      } else if (this.data.journey == undefined) {
        await draftsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedDraftId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, privacy: this.data.privacy}})
      } else {
        await draftsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedDraftId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, journey: this.data.journey, privacy: this.data.privacy}})
      }
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Draft.prototype.update2 = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let draft = await Draft.findSingleById(this.requestedDraftId, this.userid)
      if (draft.isVisitorOwner) {
        // actually update the db
        let status = await this.actuallyUpdate2()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Draft.prototype.actuallyUpdate2 = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      if (this.data.journey == "REMOVE JOURNEY") {
        await draftsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedDraftId)}, {$unset: {journey: ""}}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, privacy: this.data.privacy}})
      } else if (this.data.journey == undefined) {
        await draftsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedDraftId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, privacy: this.data.privacy}})
      } else {
        await draftsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedDraftId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, journey: this.data.journey, privacy: this.data.privacy}})
      }
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
        journey: 1,
        body: 1,
        popup: 1,
        createdDate: 1,
        authorId: "$author",
        hasPhoto: 1,
        privacy: 1,
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


Draft.findJourneysByUsername = async function(username) {
  let draftJourneys = await draftsCollection.distinct('journey',{authorUsername: username}, {journey: {exists: true}})
  let entryJourneys = await entriesCollection.distinct('journey',{authorUsername: username}, {journey: {exists: true}})
  let journeys = draftJourneys.concat(entryJourneys)
  let cleanJourneys = [...new Set(journeys)]

  return cleanJourneys
}


Draft.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !ObjectId.isValid(id)) {
      reject()
      return
    }
    
    let drafts = await Draft.reusableDraftQuery([
      {$match: {_id: new ObjectId(id)}}
    ], visitorId)

    if (drafts.length) {
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
        await draftsCollection.deleteOne({_id: new ObjectId(draftIdToDelete)})
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