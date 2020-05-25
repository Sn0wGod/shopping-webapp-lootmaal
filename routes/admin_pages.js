var express = require("express");
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get Page model
var Page = require('../models/page');

router.get("/",isAdmin, function(req , res){
  Page.find({}).sort({sorting: 1}).exec(function(err,pages){
    res.render('admin/pages', {
      pages: pages
    });
  });
});

router.get("/add-pages",isAdmin, function(req , res){
  var title = "";
  var slug = "";
  var content = "";

  res.render("admin/add_page", {
    title: title,
    slug: slug,
    content: content
  });
});

router.post("/add-pages", function(req , res){

  var title = req.body.title;
  var slug = req.body.slug;
  var content = req.body.content;
  if(title.length<1 && slug.length<1){
    req.flash('danger', 'Title and slug is required.');
    res.render("admin/add_page",{title: title, slug: slug, content: content});
  }

  Page.findOne({slug: slug}, function(err,page){
    if(page) {
      req.flash('danger', 'Page slug exists, choose another.');
      res.render("admin/add_page", {
        title: title,
        slug: slug,
        content: content
      });
    } else{
      var page = new Page ({
        title: title,
        slug: slug,
        content: content,
        sorting: 100
      });
      page.save(function(err){
        if(err){
          console.log(err);
        }else{

          Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
              if (err) {
                  console.log(err);
              } else {
                  req.app.locals.pages = pages;
              }
          });

          req.flash('success', 'Page added!');
          res.redirect('/admin/pages');
        }
      });
    }
  });

});

// Sort pages function
function sortPages(ids, callback) {
    var count = 0;

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        count++;

        (function (count) {
            Page.findById(id, function (err, page) {
                page.sorting = count;
                page.save(function (err) {
                    if (err)
                        return console.log(err);
                    ++count;
                    if (count >= ids.length) {
                        callback();
                    }
                });
            });
        })(count);

    }
}

/*
 * POST reorder pages
 */
router.post('/reorder-pages', function (req, res) {
    var ids = req.body['id[]'];

    sortPages(ids, function () {
        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
            }
        });
    });

});


//Get edit page

router.get("/edit-page/:id",isAdmin, function(req , res){
  Page.findById(req.params.id, function(err,page){
    if(err){
      console.log(err);
    } else{
      res.render("admin/edit_page", {
        title: page.title,
        slug: page.slug,
        content: page.content,
        id: page._id
      });
    }
  });
});

//post edit page

router.post("/edit-page/:id", function(req , res){

  var title = req.body.title;
  var slug = req.body.slug;
  var content = req.body.content;
  var id = req.params.id;

  Page.findOne({slug: slug, _id: {'$ne': id}}, function(err,page){
    if(page) {
      req.flash('danger', 'Page slug exists, choose another.');
      res.render("admin/edit_page", {
        title: title,
        slug: slug,
        content: content,
        id: id
      });
    } else{

      Page.findById(id, function(err,page){
        if(err){
          console.log(err);
        }else{
          page.title = title;
          page.slug = slug;
          page.content = content;

          page.save(function(err){
            if(err){
              console.log(err);
            }else{

              Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                  if (err) {
                      console.log(err);
                  } else {
                      req.app.locals.pages = pages;
                  }
              });

              req.flash('success', 'Page edited!');
              res.redirect('/admin/pages/edit-page/'+ id);
            }
          });

        }
      });


    }
  });

});

//Get delete page

router.get("/delete-page/:id",isAdmin, function(req , res){
  Page.findByIdAndRemove(req.params.id, function(err){
    if(err){
      console.log(err);
    }else{

      Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
          if (err) {
              console.log(err);
          } else {
              req.app.locals.pages = pages;
          }
      });

      req.flash('success', 'Page deleted!');
      res.redirect('/admin/pages/');
    }
  });
});


module.exports = router;
