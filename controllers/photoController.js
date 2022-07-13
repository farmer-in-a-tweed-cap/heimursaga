const Photo = require('../models/Photo')

exports.upload = function(req, res) {
  let photo = new Photo(req.body.filepond)
  photo.upload().then(function() {
      req.flash("success", "New photo successfully posted.")
      req.session.save(() => res.redirect("/create-entry"))
    }).catch(function(){
    req.flash("errors", "Upload failed.")
    req.session.save(() => res.redirect("/create-entry"))
  })
}

exports.delete = function(req, res){
  photo.delete(req.params.id).then(function(){
    req.session.save(() => res.redirect(`/draft/${req.params.id}/edit`))
  })
}