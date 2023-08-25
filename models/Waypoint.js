const waypointsCollection = require('../db').db().collection("waypoints")
const { ObjectId }= require('mongodb')
const sanitizeHTML = require('sanitize-html')

let Waypoint = function(data, Id, userid, username) {
  this.data = data
  this.id = Id
  this.errors = []
  this.userid = userid
  this.authorUsername = username
}

Waypoint.prototype.cleanUp = function() {
  if (typeof(this.data.journeyname) != "string") {this.data.journeyname = ""}


  coordinatesString = sanitizeHTML(this.data.lnglatcoordinates.trim(), {allowedTags: [], allowedAttributes: {}}),
  coordinates = coordinatesString.split(',').map(Number)
  popup = `<small>WAYPOINT</small></br><strong>${sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}})}</br></strong><p>${sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}})}</p>`


    this.data = {
      _id: ObjectId(this.id),
      journey: sanitizeHTML(this.data.journeyname.trim(), {allowedTags: [], allowedAttributes: {}}),
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
      date: new Date(sanitizeHTML(this.data.datesingle.trim(), {allowedTags: [], allowedAttributes: {}})),
      popup: popup,
      GeoJSONcoordinates: {type: "Point", coordinates: [coordinates[0],coordinates[1]]},
      createdDate: new Date(),
      author: ObjectId(this.userid),
      authorUsername: this.authorUsername,
    }

}

Waypoint.prototype.validate = function() {
  if (this.data.GeoJSONcoordinates == 0) {this.errors.push("You must log coordinates.")}
  if (this.data.journey == 0) {this.errors.push("You must select a journey.")}

}

Waypoint.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save waypoint into database
      waypointsCollection.insertOne(this.data).then((info) => {
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

Waypoint.reusableWaypointQuery = function(uniqueOperations, visitorId, finalOperations = []) {
  return new Promise(async function(resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        _id: 1, 
        title: 1,
        date: 1,
        popup: 1,
        markertype: "waypoint",
        GeoJSONcoordinates: 1,
        coordinates: "$GeoJSONcoordinates.coordinates",
        journey: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]},
      }}
    ]).concat(finalOperations)

    let waypoints = await waypointsCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    waypoints = waypoints.map(function(waypoint) {
      waypoint.isVisitorOwner = waypoint.authorId.equals(visitorId)

      waypoint.author = {
        username: waypoint.author.username,
      }
      return waypoint
    })
    resolve(waypoints)
  })
}

module.exports = Waypoint