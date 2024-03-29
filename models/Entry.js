const entriesCollection = require('../db').db().collection("entries")
const draftsCollection = require('../db').db().collection("drafts")
const followsCollection = require('../db').db().collection("follows")
const usersCollection = require('../db').db().collection("users")
const { ObjectId } = require('mongodb')
const User = require('./User')
const sanitizeHTML = require('sanitize-html')
const { Photo } = require('./Photo')
const mapboxgl = require('mapbox-gl');
const Waypoint = require('./Waypoint')


//entriesCollection.createIndex({title: "text", body: "text", place: "text", authorUsername: "text"})

//entriesCollection.updateMany({}, {$set: {url: "https://heimursaga.com/entry/"}})



let Entry = function(data, photo, Id, userid, username, requestedEntryId) {
  this.data = data
  this.photo = photo
  this.id = Id
  this.errors = []
  this.userid = userid
  this.authorUsername = username
  this.requestedEntryId = requestedEntryId
}

Entry.prototype.cleanUp = function() {
  if (typeof(this.data.title) != "string") {this.data.title = ""}
  if (typeof(this.data.place) != "string") {this.data.place = ""}
  if (typeof(this.data.body) != "string") {this.data.body = ""}
  if (typeof(this.data.journeyname) != "string") {this.data.journeyname = ""}


  coordinatesString = sanitizeHTML(this.data.lnglatcoordinates.trim(), {allowedTags: [], allowedAttributes: {}}),
  coordinates = coordinatesString.split(',').map(Number)

  var maxLength = 100
  var bodyExcerpt = sanitizeHTML((this.data.body.trim()).substr(0,maxLength), {allowedTags: [], allowedAttributes: {}})
  bodyExcerpt = bodyExcerpt.substr(0, Math.min(bodyExcerpt.length, bodyExcerpt.lastIndexOf(" ")))
  bodyExcerpt = bodyExcerpt.replace(/(\r\n|\n|\r)/gm," ")
  var date = sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}})
  var dateString = new Date(date).toLocaleString('default',{month: 'short'})+" "+new Date(date).getDate()+", "+new Date(date).getFullYear()

  popup = `<strong>${sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}})}</br><i class='align-middle me-0 fas fa-fw fa-map-marker-alt text-primary'></i></strong>${sanitizeHTML(this.data.place.trim(), {allowedTags: [], allowedAttributes: {}})}</br><p>on ${dateString} by ${this.authorUsername}</p><p>${bodyExcerpt}...</p>`
  //popup = JSON.stringify(popup)
  popup = popup.replace (/(^")|("$)/g, '')

  if (this.photo.length) {this.photo = true} else {this.photo = false}

  if (this.data.journeyname == "") {
    this.data = {
      _id: ObjectId(this.id),
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
      place: sanitizeHTML(this.data.place.trim(), {allowedTags: [], allowedAttributes: {}}),
      date: (sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}})),
      body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
      GeoJSONcoordinates: {type: "Point", coordinates: [coordinates[0],coordinates[1]]},
      popup: popup,
      createdDate: new Date(),
      author: ObjectId(this.userid),
      authorUsername: this.authorUsername,
      hasPhoto: this.photo,
      privacy: this.data.flexRadioDefault,
      url: `https://heimursaga.com/entry/${this.id}`
    }
  } else {
    this.data = {
      _id: ObjectId(this.id),
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
      place: sanitizeHTML(this.data.place.trim(), {allowedTags: [], allowedAttributes: {}}),
      date: (sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}})),
      body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
      journey: sanitizeHTML(this.data.journeyname.trim(), {allowedTags: [], allowedAttributes: {}}),
      GeoJSONcoordinates: {type: "Point", coordinates: [coordinates[0],coordinates[1]]},
      popup: popup,
      createdDate: new Date(),
      author: ObjectId(this.userid),
      authorUsername: this.authorUsername,
      hasPhoto: this.photo,
      privacy: this.data.flexRadioDefault,
      url: `https://heimursaga.com/entry/${this.id}`
    }
  }

}

Entry.prototype.validate = function() {
  if (this.data.title == "") {this.errors.push("You must provide a title.")}
  if (this.data.place == "") {this.errors.push("You must provide a place.")}
  if (this.data.body == "") {this.errors.push("You must provide content.")}
  if (coordinates == 0) {this.errors.push("You must log coordinates.")}
}

Entry.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save entry into database
      entriesCollection.insertOne(this.data).then((info) => {
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

Entry.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let entry = await Entry.findSingleById(this.requestedEntryId, this.userid)
      if (entry.isVisitorOwner) {
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

Entry.prototype.actuallyUpdate = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      if (this.data.journey == "REMOVE JOURNEY") {
        await entriesCollection.findOneAndUpdate({_id: new ObjectId(this.requestedEntryId)}, {$unset: {journey: ""}}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, popup: this.data.popup, privacy: this.data.privacy}})
      } else if (this.data.journey == undefined) {
        await entriesCollection.findOneAndUpdate({_id: new ObjectId(this.requestedEntryId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, popup: this.data.popup, privacy: this.data.privacy}})
      } else {
        await entriesCollection.findOneAndUpdate({_id: new ObjectId(this.requestedEntryId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, journey: this.data.journey, popup: this.data.popup, privacy: this.data.privacy}})
      }
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Entry.prototype.update2 = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let entry = await Entry.findSingleById(this.requestedEntryId, this.userid)
      if (entry.isVisitorOwner) {
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

Entry.prototype.actuallyUpdate2 = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {

      if (this.data.journey == "REMOVE JOURNEY") {
        await entriesCollection.findOneAndUpdate({_id: new ObjectId(this.requestedEntryId)}, {$unset: {journey: ""}}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, popup: this.data.popup, privacy: this.data.privacy, hasPhoto: this.photo}})
      } else if (this.data.journey == undefined) {
        await entriesCollection.findOneAndUpdate({_id: new ObjectId(this.requestedEntryId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, popup: this.data.popup, privacy: this.data.privacy, hasPhoto: this.photo}})
      } else {
        await entriesCollection.findOneAndUpdate({_id: new ObjectId(this.requestedEntryId)}, {$set: {GeoJSONcoordinates: this.data.GeoJSONcoordinates, title: this.data.title, place: this.data.place, date: this.data.date, body: this.data.body, journey: this.data.journey, popup: this.data.popup, privacy: this.data.privacy, hasPhoto: this.photo}})
      }
      
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Entry.reusableEntryQuery = function(uniqueOperations, visitorId, finalOperations = []) {
  return new Promise(async function(resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        _id: 1, 
        title: 1,
        place: 1,
        date: 1,
        GeoJSONcoordinates: 1,
        coordinates: "$GeoJSONcoordinates.coordinates",
        markertype: "entry",
        journey: 1,
        body: 1,
        popup: 1,
        createdDate: 1,
        hasPhoto: 1,
        privacy: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]},
      }}
    ]).concat(finalOperations)

    let entries = await entriesCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    entries = entries.map(function(entry) {
      entry.isVisitorOwner = entry.authorId.equals(visitorId)
      //entry.authorId = undefined


      entry.author = {
        username: entry.author.username,
        avatar: new User(entry.author, true).avatar
      }
      return entry
    })
    resolve(entries)
  })
}

Entry.journeyList = function(uniqueOperations) {
  return new Promise(async function(resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$project: {
        _id: 0,
        journey: 1
      }}
    ])

    let journeys = await entriesCollection.aggregate(aggOperations).toArray()

    resolve(journeys)
  })
}



Entry.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !ObjectId.isValid(id)) {
      reject()
      return
    }
    
    let entries = await Entry.reusableEntryQuery([
      {$match: {_id: new ObjectId(id)}}
    ], visitorId)

    if (entries.length) {
      resolve(entries[0])
    } else {
      reject()
    }
  })
}

Entry.findByAuthorId = function(authorId) {
  return Entry.reusableEntryQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.findByAuthorIdandJourney = function(journey, authorId) {
  return Entry.reusableEntryQuery([
    {$match: {author: authorId}},
    {$match: {journey: journey}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.findPublicByAuthorId = function(authorId) {
  return Entry.reusableEntryQuery([
    {$match: {author: authorId}},
    {$match: {privacy: "public"}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.findPublicByAuthorIdandJourney = function(journey, authorId) {
  return Entry.reusableEntryQuery([
    {$match: {author: authorId}},
    {$match: {privacy: "public"}},
    {$match: {journey: journey}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.findByJourneyAndAuthor = function(authorId, journey) {
  return Entry.reusableEntryQuery([
    {$match: {author: authorId}},
    {$match: {privacy: "public"}},
    {$match: {journey: journey}},
    {$sort: {createdDate: -1}}
  ])
}


Entry.findJourneysByUsername = async function(username) {
  let journeys = await entriesCollection.distinct('journey',{authorUsername: username}, {journey: {exists: true}})
  return journeys
}

Entry.findAllJourneysByUsername = async function(username) {
  let draftJourneys = await draftsCollection.distinct('journey',{authorUsername: username}, {journey: {exists: true}})
  let entryJourneys = await entriesCollection.distinct('journey',{authorUsername: username}, {journey: {exists: true}})
  let journeys = draftJourneys.concat(entryJourneys)
  let cleanJourneys = [...new Set(journeys)]

  return cleanJourneys
}

Entry.delete = function(entryIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let entry = await Entry.findSingleById(entryIdToDelete, currentUserId)
      if (entry.isVisitorOwner) {
        await entriesCollection.deleteOne({_id: new ObjectId(entryIdToDelete)})
        resolve()
      } else {
        reject()
      }    
    } catch {
      reject()
    }
  })
}

Entry.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) == "string") {
      let entries = await Entry.reusableEntryQuery([
        {$match: {$text: {$search: searchTerm}}},
        {$match: {privacy: "public"}},
      ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
      resolve(entries)
    } else { 
      reject()
    }
  })
}

Entry.countEntriesByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let entryCount = await entriesCollection.countDocuments({author: id})
    resolve(entryCount)
  })
}

Entry.getFeed = async function(bounds) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  return Entry.reusableEntryQuery([
    {$match: {privacy: "public"}},    
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.getFollowedFeed = async function(bounds, id) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  // create an array of the user ids that the current user follows
  let followedUsers = await followsCollection.find({authorId: new ObjectId(id)}).toArray()
  followedUsers = followedUsers.map(function(followDoc) {
    return followDoc.followedId
  })

  // look for posts where the author is in the above array of followed users
  return Entry.reusableEntryQuery([
    {$match: {author: {$in: followedUsers}}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$match: {privacy: "public"}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.getJournalFeed = async function(bounds, id) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  let userId = new ObjectId(id)

  // look for posts where the author is in the above array of followed users
  return Entry.reusableEntryQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$match: {privacy: "public"}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.getJournalFeedbyJourney = async function(bounds, id, journey) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  let userId = new ObjectId(id)

  // look for posts where the author is in the above array of followed users
  return Entry.reusableEntryQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$match: {privacy: "public"}},
    {$match: {journey: journey}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.getJournalFeedbyJourneyandDate = async function(bounds, id, journey) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  let userId = new ObjectId(id)

  let entries = await Entry.reusableEntryQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$match: {privacy: "public"}},
    {$match: {journey: journey}},
    {$sort: {date: 1}}
  ])

  let waypoints = await Waypoint.reusableWaypointQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$sort: {date: 1}},
    {$match: {journey: journey}},
  ])

  return entries.concat(waypoints)

}

Entry.getMyJournalFeed = async function(bounds, id) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  let userId = new ObjectId(id)

  return Entry.reusableEntryQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$sort: {createdDate: -1}}
  ])
}

Entry.getMyJournalFeedbyJourney = async function(bounds, id, journey) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  let userId = new ObjectId(id)

  return Entry.reusableEntryQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$sort: {createdDate: -1}},
    {$match: {journey: journey}},
  ])
}

Entry.getMyJournalFeedbyJourneyandDate = async function(bounds, id, journey) {
  let LngLatArray = bounds.split(',')
  var LngWest = parseFloat(LngLatArray[0])
  var LatSouth = parseFloat(LngLatArray[1])
  var LngEast = parseFloat(LngLatArray[2])
  var LatNorth = parseFloat(LngLatArray[3])
  let userId = new ObjectId(id)

  let entries = await Entry.reusableEntryQuery([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$sort: {date: 1}},
    {$match: {journey: journey}},
  ])

  let waypoints = await Waypoint.reusableWaypointQueryOwner([
    {$match: {author: userId}},
    {$match: {$and: [{"GeoJSONcoordinates.coordinates.0": {$gt: LngWest, $lt: LngEast}}, {"GeoJSONcoordinates.coordinates.1": {$gt: LatSouth, $lt: LatNorth}}]}},
    {$sort: {date: 1}},
    {$match: {journey: journey}},
  ])

  return entries.concat(waypoints)

}

Entry.returnAll = function() {
  return new Promise(async function(resolve,reject) {
    let entries = entriesCollection.find({}).sort({createdDate: -1}).toArray()
    //let users = usersCollection.find({}).toArray()
    resolve(entries)
  })
  
}

module.exports = Entry