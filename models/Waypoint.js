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

    this.data = {
      _id: ObjectId(this.id),
      journey: sanitizeHTML(this.data.journeyname.trim(), {allowedTags: [], allowedAttributes: {}}),
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

module.exports = Waypoint