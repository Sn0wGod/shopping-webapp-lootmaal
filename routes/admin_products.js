var express = require("express");
var router = express.Router();
var mkdirp = require("mkdirp");
var fs = require("fs-extra");
var resizeImg = require("resize-img");
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get product model
var Product = require('../models/product');

//Get category model
var Category = require('../models/category');

router.get("/",isAdmin, function(req , res){
    var count;
    Product.estimatedDocumentCount(function(err,c){
      count = c;
    });

    Product.find(function(err,products){
      res.render("admin/products", {products: products, count: count});
    });
});

router.get("/add-product",isAdmin, function(req , res){
  var title = "";
  var desc = "";
  var price = "";

  Category.find(function(err,categories){
    res.render("admin/add_product", {
      title: title,
      desc: desc,
      categories: categories,
      price: price
    });
  });
});

router.post("/add-product", function(req , res){

  var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;

  if(title.length<1 && slug.length<1 && desc.length<1 && price.length<1){
    req.flash('danger', 'Title, slug, Description, Price are required.');
    res.render("admin/add_product",{title: title, slug: slug, desc: desc, price: price});
  }

  Product.findOne({slug: slug}, function(err,product){
    if(product) {
      req.flash('danger', 'Product Title exists, choose another.');
      res.render("admin/add_product", {
        title: title,
        slug: slug,
        desc: desc,
        price: price
      });
    } else{

      var price2 = parseFloat(price).toFixed(2);

      var product = new Product ({
        title: title,
        slug: slug,
        desc: desc,
        price: price2,
        category: category,
        image: imageFile
      });
      product.save(function(err){
        if(err){
          console.log(err);
        }else{

          mkdirp('public/product_images/' + product._id, function(err){
            return console.log(err);
          });

          mkdirp('public/product_images/' + product._id + '/gallery', function(err){
            return console.log(err);
          });

          mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function(err){
            return console.log(err);
          });

          if(imageFile != ""){
            var productImage = req.files.image;
            var path = 'public/product_images/' + product._id + '/' + imageFile;

            productImage.mv(path, function(err){
              return console.log(err);
            });
          }


          req.flash('success', 'Product added!');
          res.redirect('/admin/products');
        }
      });
    }
  });

});

//Get edit product

router.get("/edit-product/:id",isAdmin, function(req , res){
    Category.find(function(err,categories){

      Product.findById(req.params.id, function(err,p){
        if(err){
          console.log(err);
        }else{
          var galleryDir = 'public/product_images/' + p._id + '/gallery';
          var galleryImages = null;

          fs.readdir(galleryDir, function(err,files){
            if(err){
              console.log(err);
            }else{
              galleryImages = files;

              res.render('admin/edit_product',{
                title: p.title,
                desc: p.desc,
                categories: categories,
                category: p.category.replace(/\s+/g, '-').toLowerCase(),
                price: p.price,
                image: p.image,
                galleryImages: galleryImages,
                id: p._id
              });
            }
          });
        }
      });
    });
});

//post edit product

router.post("/edit-product/:id", function(req , res){
  var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;
  var pimage = req.body.pimage;
  var id = req.params.id;

  if(title.length<1 && slug.length<1 && desc.length<1 && price.length<1){
    req.flash('danger', 'Title, slug, Description, Price are required.');
    res.render("admin/add_product",{title: title, slug: slug, desc: desc, price: price});
  }

  Product.findOne({slug: slug, _id: {'$ne': id}}, function(err,p){
    if(err){
      console.log(err);
    }
    if(p){
      req.flash('danger', 'Product title exists, choose another.');
      res.redirect('/admin/products/edit-product/' + id);
    }else{
      Product.findById(id, function(err, p){
        if(err){
          console.log(err);
        }
        p.title= title;
        p.slug= slug;
        p.desc= desc;
        p.price= parseFloat(price).toFixed(2);
        p.category = category;
        if(imageFile != ""){
          p.image = imageFile;
        }
        p.save(function(err){
          if(err){
            console.log(err);
          }
          if(imageFile != ""){
            if(pimage  != ""){
              fs.remove('public/product_images/' + id + '/' + pimage, function(err){
                if(err){
                  console.log(err);
                }
              });
            }

            var productImage = req.files.image;
            var path = 'public/product_images/' + id + '/' + imageFile;

            productImage.mv(path, function(err){
              return console.log(err);
            });
          }

          req.flash('success', 'Product edited!');
          res.redirect('/admin/products/edit-product/' + id);
        });
      });
    }
  });
});

/*
 * POST product gallery
 */
router.post('/product-gallery/:id', function (req, res) {

    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), {width: 100, height: 250}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);

});

/*
 * GET delete image
 */
router.get('/delete-image/:image',isAdmin, function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    });
});


/*
 * GET delete product
 */
router.get('/delete-product/:id',isAdmin, function (req, res) {

    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, function (err) {
                console.log(err);
            });

            req.flash('success', 'Product deleted!');
            res.redirect('/admin/products');
        }
    });

});


module.exports = router;
