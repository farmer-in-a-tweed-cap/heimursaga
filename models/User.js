const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection("users")
const validator = require("validator")
const md5 = require('md5')
const { get } = require('../router')
const sanitizeHTML = require('sanitize-html')

let User = function(data, getAvatar, username) {
    this.data = data
    this.errors = []
    this.username = username
    if (getAvatar == undefined) {getAvatar = false}
    if (getAvatar) {this.getAvatar()}
}

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") {this.data.username = ""}
    if (typeof(this.data.email) != "string") {this.data.email = ""}
    if (typeof(this.data.password) != "string") {this.data.password = ""}

    // get rid of any bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password,
        bio: sanitizeHTML(this.data.bio, {allowedTags: [], allowedAttributes: {}}),
        currentlyin: sanitizeHTML(this.data.currentlyin, {allowedTags: [], allowedAttributes: {}}),
        livesin: sanitizeHTML(this.data.livesin, {allowedTags: [], allowedAttributes: {}}),
        from: sanitizeHTML(this.data.from, {allowedTags: [], allowedAttributes: {}}),
        instagram: this.data.instagram,
        website: this.data.website,
        type: "Explorer"
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push("You must provide a username.")}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
        if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
        //if (this.data.password == "") {this.errors.push("You must provide a password.")}
        if (this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("Password must be at least 12 characters.")}
        if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters.")}
        if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters.")}
        if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters.")}
        if (this.data.bio.length > 200) {this.errors.push("Bio cannot exceed 200 characters.")}
    
        // only if username is valid then check to see if it's already taken
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if (usernameExists) {this.errors.push("That username is already taken.")}
        }
    
        // only if email is valid then check to see if it's already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("That email is already taken.")}
        }
        resolve()
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                this.data = attemptedUser
                this.getAvatar()
                resolve("Congrats")
            } else {
                reject("Invalid username / password")
            }
        }).catch(function() {
            reject("Please try again later.")
        })
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        // step #1 validate user data
        this.cleanUp()
        await this.validate()
    
        // step #2 only if there are no validation errors
        // then save the user data into a database
        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await User.findByUsername(this.data.username)
        console.log(user)
        if (user) {
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
  
  User.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp()
      //this.validate()
      if (!this.errors.length) {
        await usersCollection.findOneAndUpdate({username: this.data.username}, {$set: {username: this.data.username, email: this.data.email, bio: this.data.bio, currentlyin: this.data.currentlyin, livesin: this.data.livesin, from: this.data.from, type: this.data.type}})
        resolve("success")
      } else {
        resolve("failure")
      }
    })
  }

User.findByUsername = function(username) {
    return new Promise(function(resolve, reject) {
        if (typeof(username) != "string") {
            reject()
            return
        }
        usersCollection.findOne({username: username}).then(function(userDoc) {
            if (userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar,
                    email: userDoc.data.email,
                    bio: userDoc.data.bio,
                    currentlyin: userDoc.data.currentlyin,
                    livesin: userDoc.data.livesin,
                    from: userDoc.data.from,
                    instagram: userDoc.data.instagram,
                    website: userDoc.data.website,
                    type: userDoc.data.type
                }
                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function() {
            reject("404")
        })
    })
}

User.returnAll = function() {
    return new Promise(async function(resolve,reject) {
      let users = usersCollection.find({}).toArray()
      resolve(users)
    })
  }

module.exports = User