const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const exphbs = require("express-handlebars");
const fileUpload=require("express-fileupload")
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const session = require("express-session");
const dbconfig=require('./config/connection')

const app = express();


app.use(
  session({
    secret: "keyboard cat",
    cookie: {maxAge:6000000},
  })
);


// view engine setup
const hbs = exphbs.create({
  defaultLayout: path.join(__dirname, "views/layout/layout"),
  partialsDir: path.join(__dirname, "views/partials/"),
  extname: ".hbs",
  helpers: require('./helpers/hbs-custom-helpers')
});

app.engine("hbs", hbs.engine);
app.set("views", path.join(__dirname, "views/pages"));
app.set("view engine", "hbs");




app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/stylesheets",express.static(__dirname+"/public"));

dbconfig.connect()


app.use(fileUpload());
app.use('/', indexRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error",{errstatus:true});
});

module.exports = app;
