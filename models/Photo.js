const dotenv = require('dotenv')
dotenv.config()
const B2 = require('backblaze-b2')
const multer = require('multer')
const sharp = require('sharp')


const b2 = new B2({
    applicationKeyId: process.env.B2_APPID,
    applicationKey: process.env.B2_KEY
})




const storage = multer.memoryStorage()
const multerUploads = multer({storage: storage}).any()


const Photo = function(data) {
    this.photo = data
}


Photo.prototype.uploadPhoto = async function(id) {
    let filename = encodeURI(id)
    await b2.authorize()
    return new Promise((resolve, reject) => {
    
    const uploadPromises = this.photo.map(async function(photo){
        let response = await b2.getUploadUrl({bucketId: process.env.ENTRY_PHOTO_BUCKETID})
        let uploadURL = response.data.uploadUrl;
        let authToken = response.data.authorizationToken;
        let pngToWebp = await sharp(photo.buffer).webp({lossless: true}).toBuffer()
        let jpegToWebp = await sharp(photo.buffer).webp({quality: 65}).toBuffer()
        
        let webpPhoto = (photo.mimetype === 'image/jpeg') ? jpegToWebp:pngToWebp
        
        b2.uploadFile({
            uploadAuthToken: authToken,
            fileName: filename,
            data: webpPhoto,
            uploadUrl: uploadURL,
            mime: 'image/webp'

        }).then(() => {
            resolve()
    }).catch(() => {
        reject(console.log("photo upload unsuccesful"))
    })
})    
}
)}



 Photo.delete = function(photoNameToDelete) {
    return new Promise(async (resolve, reject) => {
    await b2.authorize()
      try {
        let photo = await b2.listFileNames({
            bucketId: process.env.ENTRY_PHOTO_BUCKETID,
            startFileName: photoNameToDelete,
            maxFileCount: 1
        })
        if (photo) {
          await b2.deleteFileVersion({
            fileId: photo.data.files[0].fileId,
            fileName: photoNameToDelete,
            })
          resolve()
        } else {
          resolve()
        }    
      } catch {
        resolve()
      }
    })
  }



module.exports = {Photo, multerUploads}