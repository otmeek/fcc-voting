'use strict';

var express      = require('express');
var mongo        = require('mongodb').MongoClient;
var path         = require('path');
var bodyParser   = require('body-parser');
var os           = require('os');
var ifaces       = os.networkInterfaces();

var passport     = require('passport');
var flash        = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var session      = require('express-session');

var configDB     = require('./config/database.js');

var app = express();

require('dotenv').load();

app.use(express.static(__dirname + '/public'));
app.use('/polls', express.static(__dirname + '/public'));
app.use('/polls/:STRING', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({     
    extended: false
}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({
    secret: 'everysinglecatiscute',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

app.set('view engine', 'jade');

var db;

var passDb = function(req, res, next) {
	if (!db) {
		mongo.connect(process.env.MONGOLAB_URI, function(err, database) {
			if (err) throw err;
			db = database;

			req.db = db;
		  next();
		});
	} else {
	  req.db = db;
	  next();
	}
}

require('./app/routes/index.js')(app, passport, passDb);

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});