var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var session = require('express-session');
var fileUpload = require('express-fileupload');
var passport = require("passport");
//var expressValidator = require("express-validator");
const { check, oneOf, validationResult } = require('express-validator');

var config = require("./config/database");


var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//set global errors variable
app.locals.errors = null;

// Get Page Model
var Page = require('./models/page');

// Get all pages to pass to header.ejs
Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});

// Get category Model
var Category = require('./models/category');

// Get all category to pass to header.ejs
Category.find(function (err, categories) {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});

//expree fileUpload middleware
app.use(fileUpload());

// Express session
app.use(session({
  secret: 'Oue little secret',
  resave: true,
  saveUninitialized: true
//  cookie: {secure:true}
}));

//Express validator
/* app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
})); */

//Express message
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//passport config
require('./config/passport')(passport);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get("*", function(req,res,next){
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});

mongoose.connect(config.database, {useNewUrlParser: true,useUnifiedTopology: true});

//Routes
var pages = require("./routes/pages.js");
var products = require("./routes/products.js");
var cart = require("./routes/cart.js");
var users = require("./routes/users.js");
var adminPages = require("./routes/admin_pages.js");
var adminCategories = require("./routes/admin_categories.js");
var adminProducts = require("./routes/admin_products.js");

app.use("/admin/pages",adminPages);
app.use("/admin/categories",adminCategories);
app.use("/admin/products",adminProducts);
app.use("/products",products);
app.use("/cart",cart);
app.use("/users",users);
app.use("/",pages);


app.listen(process.env.PORT || 3000, function(){
  console.log("Server started 3000");
});
