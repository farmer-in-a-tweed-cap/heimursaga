const MongoClient = require('mongodb');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage')

const url = "mongodb+srv://admin:adminuser@cluster0.qcizp.mongodb.net/heimursaga?retryWrites=true&w=majority";
const dbName = "heimursaga";

function photoFilter(req, file, cb) {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }


let storage = new GridFsStorage({
  url: url,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: 'photos',      
      filename: file.originalname     
    }
  }
});

let upload = null;

storage.on('connection', (db) => {
  //Setting up upload for a single file
  upload = multer({
    storage: storage,
    fileFilter: photoFilter,
  }).single('upload');
});


exports.uploadFile = (req, res) => {
  upload(req, res, (err) => {
    if(err){
        req.flash("error", "file upload failed")
        req.session.save(function() {
            res.redirect(`/journal/${req.session.user.username}`)})
    } else {
        req.flash("success", "file upload succeeded")
        req.session.save(function() {
            res.redirect(`/journal/${req.session.user.username}`)})
    }
  });
};

exports.getFile = (req, res) => {
  //Accepting user input directly is very insecure and should 
  //never be allowed in a production app. Sanitize the input.
  let fileName = req.body.text1;
  //Connect to the MongoDB client
  MongoClient.connect(url, function(err, client){

    if(err){
      return res.render('index', {title: 'Uploaded Error', message: 'MongoClient Connection error', error: err.errMsg});
    }
    const db = client.db(dbName);
    
    const collection = db.collection('photos.files');
    const collectionChunks = db.collection('photos.chunks');
    collection.find({filename: fileName}).toArray(function(err, docs){
      if(err){
        return res.render('index', {title: 'File error', message: 'Error finding file', error: err.errMsg});
      }
      if(!docs || docs.length === 0){
        return res.render('index', {title: 'Download Error', message: 'No file found'});
      }else{
        //Retrieving the chunks from the db
        collectionChunks.find({files_id : docs[0]._id}).sort({n: 1}).toArray(function(err, chunks){
          if(err){
            return res.render('index', {title: 'Download Error', message: 'Error retrieving chunks', error: err.errmsg});
          }
          if(!chunks || chunks.length === 0){
            //No data found
            return res.render('index', {title: 'Download Error', message: 'No data found'});
          }
          //Append Chunks
          let fileData = [];
          for(let i=0; i<chunks.length;i++){
            //This is in Binary JSON or BSON format, which is stored
            //in fileData array in base64 endocoded string format
            fileData.push(chunks[i].data.toString('base64'));
          }
          //Display the chunks using the data URI format
          let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
          res.render('imageView', {title: 'Image File', message: 'Image loaded from MongoDB GridFS', imgurl: finalFile});
        });
      }
      
    });
  });
};