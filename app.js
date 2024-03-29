const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const Stripe = require('./stripe')
const flash = require('connect-flash')
const markdown = require('marked')
const bodyParser = require('body-parser')
const csrf = require('csurf')
const app = express()
const sanitizeHTML = require('sanitize-html')
const expressSitemapXml = require('express-sitemap-xml')
const entriesCollection = require('./db').db().collection("entries")
const usersCollection = require('./db').db().collection("users")
const dotenv = require('dotenv')
dotenv.config()
const billingController = require('./controllers/billingController')

let sessionOptions = session({
    secret: process.env.JWT_SECRET,
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})



app.use(sessionOptions)
app.use('/webhook', bodyParser.raw({ type: 'application/json' }))
app.post('/webhook', billingController.webhook)
app.use('/connectwebhook', bodyParser.raw({ type: 'application/json' }))
app.post('/connectwebhook', billingController.connectWebhook)
app.use(flash())

app.use(function(req, res, next) {
    // make our markdown function available within ejs templates
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown.marked(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }
    
    // make all error and success messages available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")
    
    // make current user id available on the req object
    if (req.session.user) {req.visitorId = req.session.user._id} else {req.visitorId = 0}
    
    // make user session available from within view templates
    res.locals.user = req.session.user

    next()
})

const router = require('./router')

app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb', extended: false}));


app.use(express.static('dist'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(csrf())

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)


/*app.use(function(err, req, res, next){
    if(err) {
        if(err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross-site request forgery detected.")
            req.session.save(() => res.redirect('/'))
        } else {
            console.log("unknown csrf error", err)
            res.render("404")
        }
    }
})*/



function getEntryUrls() {
    return new Promise(async function(resolve,reject) {
      let entries = entriesCollection.find({privacy: "public"}).project({url: 1, _id: 0}).toArray()
      resolve(entries)
    })
  }

  function getUserUrls() {
    return new Promise(async function(resolve,reject) {
      let users = usersCollection.find({}, {url: 1, _id: 0}).toArray()
      resolve(users)
    })
  }
  

app.use(expressSitemapXml(getUrls, 'https://heimursaga.com'))

async function getUrls () {
    let primeList = [
        {url: "https://heimursaga.com/"}, 
        {url: "https://heimursaga.com/discovery"}, 
        {url: "https://heimursaga.com/about"}, 
        {url: "https://heimursaga.com/join"}, 
        {url: "https://heimursaga.com/login"}
    ]
    let entryList = await getEntryUrls()
    let userList = await getUserUrls()
    urlList = primeList.concat(entryList.concat(userList))
  return urlList
}


const server = require('http').createServer(app)

/*const io = require('socket.io')(server)

io.on('connection', function(socket) {
  socket.broadcast.emit('testNotificationFromServer', {message: "hello"})
})*/

module.exports = server