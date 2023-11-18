const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection("users")
const validator = require("validator")
const md5 = require('md5')
const sanitizeHTML = require('sanitize-html')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const billingCollection = require('../db').db().collection("billing")
const sessionsCollection = require('../db').db().collection("sessions")
const entriesCollection = require('../db').db().collection("entries")
const followsCollection = require('../db').db().collection("follows")
const draftsCollection = require('../db').db().collection("drafts")
const likesCollection = require('../db').db().collection("likes")
const highlightsCollection = require('../db').db().collection("highlights")
const SponserCollection = require("../db").db().collection("sponsors");
const connectAccCustomersCollection = require("../db").db().collection("connectAccountCustomers");
const fundsCollection = require("../db").db().collection("funds");





let bulkOps = function(req, res) {
    try {
        billingCollection.deleteMany({}).then((res) => {
            console.log(res)
        })
        SponserCollection.deleteMany({}).then((res) => {
            console.log(res)
        })
        fundsCollection.deleteMany({}).then((res) => {
            console.log(res)
        })
        connectAccCustomersCollection.deleteMany({}).then((res) => {
            console.log(res)
        })
        //usersCollection.deleteMany({registeredDate:{$gt: new Date(2023, 5, 5)}}).then((res) => {
        //    console.log(res)
        //})
        //usersCollection.updateMany({}, {$set: {settings: {emailNotifications: {followers: "true", likes: "true"}, pushNotifications: {followers: "true", likes: "true"}}}}).then((res) => {
        //    console.log(res)
        //})
        //followsCollection.deleteMany({createdDate:{$gt: new Date(2023, 5, 5)}}).then((res) => {
        //    console.log(res)
        //})
     } catch (e) {
        console.log(e);
     }
    
}


//bulkOps()



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
        type: this.data.type,
        settings: sanitizeHTML({emailNotifications: {followers: this.data.followersemailnotifications, likes: this.data.likesemailnotifications}, pushNotifications: {followers: this.data.followerspushnotifications, likes: this.data.likespushnotifications}}, {allowedTags: [], allowedAttributes: {}}),
        resetPasswordToken: {type: String, required: false},
        resetPasswordExpires: {type: Date, required: false},
        registeredDate: new Date(),
        url: `https://heimursaga.com/journal/${this.data.username.trim().toLowerCase()}`
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push("You must provide a username.")}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
        if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
        if (this.data.password == "") {this.errors.push("You must provide a password.")}
        if (this.data.password.length > 0 && this.data.password.length < 8) {this.errors.push("Password must be at least 8 characters.")}
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

User.prototype.passwordCleanUp = function() {
    if (typeof(this.data.PasswordNew) != "string") {this.data.PasswordNew = ""}

    // get rid of any bogus properties
    this.data = {
        password: this.data.PasswordNew,
        email: this.data.email
    }
}

User.prototype.passwordValidate = async function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.password == "") {this.errors.push("You must provide a password.")}
        if (this.data.password.length > 0 && this.data.password.length < 8) {this.errors.push("Password must be at least 8 characters.")}
        if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters.")}
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

User.prototype.updatePassword = function() {
    return new Promise(async (resolve, reject) => {
        username = this.data.username
        this.passwordCleanUp()
        this.passwordValidate()
        if (!this.errors.length) {
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.findOneAndUpdate({username: username}, {$set: {password: this.data.password}})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

User.prototype.updateNotifications = function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.likesemailnotifications == "true" || this.data.likesemailnotifications == null && this.data.followersemailnotifications == "true" || this.data.followersemailnotifications == null) {
            await usersCollection.findOneAndUpdate({username: this.data.username}, {$set: {settings: {emailNotifications: {followers: this.data.followersemailnotifications, likes: this.data.likesemailnotifications}, pushNotifications: {followers: this.data.followerspushnotifications, likes: this.data.likespushnotifications}}}})
            resolve("success")
        } else {
            reject(console.log("error"))
        }


    })
}

User.prototype.updateType = function() {
    return new Promise(async (resolve, reject) => {
        await usersCollection.findOneAndUpdate({username: this.data.username}, {$set: {type: this.data.type}})
            resolve("success")
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
                userDoc = new User(userDoc, true);
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
                    type: userDoc.data.type,
                    settings: userDoc.data.settings,
                    stripeAccountId: userDoc.data.stripeAccountId,
                    products: userDoc.data.products || null,
                    status: userDoc.data.status || null
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

User.findByEmail = function(email) {
    return new Promise(function(resolve, reject) {
        if (!validator.isEmail(email)) {
            reject("Please enter a valid email")
            return
        }
        usersCollection.findOne({email: email}).then(function(userDoc) {
            if (userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    email: userDoc.data.email,
                    resetPasswordToken: userDoc.data.resetPasswordToken,
                    resetPasswordExpires: userDoc.data.resetPasswordExpires,
                    url: userDoc.data.url,
                }
                resolve(userDoc)
            } else {
                reject("Email not found. Please try again.")
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

User.prototype.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    let payload = {
        id: this._id,
        email: this.email,
        username: this.username,
        firstName: this.firstName,
        lastName: this.lastName,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(expirationDate.getTime() / 1000, 10)
    });
}

User.prototype.generatePasswordReset = function() {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; //expires in an hour
};

User.prototype.updateTokens = function() {
    return new Promise(async (resolve, reject) => {
        await usersCollection.findOneAndUpdate({email: this.data.email}, {$set: {resetPasswordToken: this.resetPasswordToken, resetPasswordExpires: this.resetPasswordExpires}})
            resolve()
    })
}

User.findByToken = function(token) {
    return new Promise(function(resolve, reject) {
        usersCollection.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}}).then(function(userDoc) {
            if (userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    email: userDoc.data.email,
                    resetPasswordToken: userDoc.data.resetPasswordToken,
                    resetPasswordExpires: userDoc.data.resetPasswordExpires
                }
                resolve(userDoc)
            } else {
                reject("Invalid or expired token.")
            }
        }).catch(function() {
            reject("404")
        })
    })
}

User.prototype.resetPassword = function() {
    return new Promise(async (resolve, reject) => {
        this.passwordCleanUp()
        this.passwordValidate()
        if (!this.errors.length) {
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.findOneAndUpdate({email: this.data.email}, {$set: {password: this.data.password, resetPasswordToken: undefined, resetPasswordExpires: undefined}})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

//updating stripeId to null on subscription cancellation 
User.findAndUpdateByBillingID = async function(billingId, status){
    try{
        const billingInfo = await billingCollection.findOne({ billingId });
        console.log(billingInfo,'info')
        let userUpdated = {};
        if(billingInfo){
             userUpdated = await usersCollection.updateOne({_id: billingInfo.explorerId}, { $set:{ status}})
        }
        return userUpdated;
    }
    catch(error){
        console.log(error);
    }
}

module.exports = User