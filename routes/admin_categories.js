var express = require("express");
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get Category model
var Category = require('../models/category');

router.get("/", isAdmin, function(req , res){
  Category.find(function(err,categories){
    if(err){
      console.log(err);
    }else{
      res.render("admin/categories",{categories: categories});
    }
  });
});

router.get("/add-category",isAdmin, function(req , res){
  var title = "";

  res.render("admin/add_category", {
    title: title
  });
});

router.post("/add-category", function(req , res){

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  if(title.length<1){
    req.flash('danger', 'Title required.');
    res.render("admin/add_category",{title: title});
  }

  Category.findOne({slug: slug}, function(err,category){
    if(category) {
      req.flash('danger', 'Category slug exists, choose another.');
      res.render("admin/add_category", {
        title: title
      });
    } else{
      var category = new Category ({
        title: title,
        slug: slug
      });
      category.save(function(err){
        if(err){
          console.log(err);
        }else{

          Category.find(function (err, categories) {
              if (err) {
                  console.log(err);
              } else {
                  req.app.locals.categories = categories;
              }
          });

          req.flash('success', 'Category added!');
          res.redirect('/admin/categories');
        }
      });
    }
  });

});



//Get edit category

router.get("/edit-category/:id",isAdmin, function(req , res){
  Category.findById(req.params.id, function(err,category){
    if(err){
      console.log(err);
    } else{
      res.render("admin/edit_category", {
        title: category.title,
        id: category._id
      });
    }
  });
});

//post edit category

router.post("/edit-category/:id", function(req , res){

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var id = req.params.id;
  if(title.length<1){
    req.flash('danger', 'Title required');
    res.render("admin/edit_category",{title: title, id: id});
  }

  Category.findOne({slug: slug, _id: {'$ne': id}}, function(err,category){
    if(category) {
      req.flash('danger', 'Category Title exists, choose another.');
      res.render("admin/edit_category", {
        title: title,
        id: id
      });
    } else{

      Category.findById(id, function(err,category){
        if(err){
          console.log(err);
        }else{
          category.title = title;
          category.slug = slug;

          category.save(function(err){
            if(err){
              console.log(err);
            }else{

              Category.find(function (err, categories) {
                  if (err) {
                      console.log(err);
                  } else {
                      req.app.locals.categories = categories;
                  }
              });

              req.flash('success', 'Category edited!');
              res.redirect('/admin/categories/edit-category/'+id);
            }
          });

        }
      });


    }
  });

});

//Get delete category

router.get("/delete-category/:id",isAdmin, function(req , res){
  Category.findByIdAndRemove(req.params.id, function(err){
    if(err){
      console.log(err);
    }else{

      Category.find(function (err, categories) {
          if (err) {
              console.log(err);
          } else {
              req.app.locals.categories = categories;
          }
      });

      req.flash('success', 'Category deleted!');
      res.redirect('/admin/categories/');
    }
  });
});


module.exports = router;
