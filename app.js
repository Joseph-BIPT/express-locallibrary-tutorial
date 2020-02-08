var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');
var compression = require('compression');
var helmet = require('helmet');

var app = express();

app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var dev_db_url = 'mongodb+srv://Joseph:Gq7qTpbq6TZEXgYz@cluster0-iuis4.mongodb.net/local_library';
//var prod_db_url = 'mongodb+srv://User_for_production:a5Bor4sik3cvO@cluster0-iuis4.mongodb.net/ProductionDB';
//var dev_db_url = 'mongodb+srv://User_for_production:a5Bor4sik3cvO@cluster0-mbdj7.mongodb.net/ProductionDB?retryWrites=true'
if(process.env.MONGODB_URI){
	var mongoDB = process.env.MONGODB_URI;
}else
	var mongoDB = dev_db_url;

mongoose.connect(mongoDB,{useNewUrlParser:true, useFindAndModify:false, useUnifiedTopology: true } );
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = app;
