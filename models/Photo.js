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

Photo.prototype.photoBuckets = async function GetBucket() {
    try {
      await b2.authorize()
      let response = await b2.listFileNames({bucketId: '35abac16599ccd7073c8031d'})
      return response.data
    } catch (err) {
      console.log('Error getting bucket:', err);
    }
  }


/*Photo.prototype.photoBuckets().then(function(result) {
    console.log(result)
 })*/


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
        reject()
    })
})    
}
)}

 Photo.getPhotoUrl = function(name) {
     return new Promise(async function(resolve, reject) {
        let authToken = await b2.authorize()
        let url = authToken.data.downloadUrl
        let photoUrl = url+'/file/'+'heimursaga-entry-photos'+'/'+name

        if (photoUrl) {
          resolve(photoUrl)
          } else {
            reject()
          }
     })

 }


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


Photo.checkPhoto = async function(name) {
  await b2.authorize()
  return new Promise((resolve, reject) => {

  b2.listFileNames({
    bucketId: process.env.ENTRY_PHOTO_BUCKETID,
    startFileName: name,
    maxFileCount: 1
}).then((photo) => {
  if (photo.data.files[0].fileName === name) {
    resolve(true)
  } else {
    resolve(false)
  }
}).catch(() => {
  reject(false)
})
})
}

/*let name = "618856b573b36e5472c395e7"
Photo.checkPhoto(name).then((result) => {
    console.log(result)
})*/



module.exports = {Photo, multerUploads}