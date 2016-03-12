'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;
var path = require('path');
var randomstring = require('randomstring');

var app = express();
require('dotenv').load();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    
    var polls = {};
    
    mongo.connect('mongodb://localhost:27017/fccvote', function(err, db) {
       if(err) throw err; 
        
        var collection = db.collection('polls');
        var data = collection.find().toArray(function(err, docs) {
            if(err) throw err;
            polls.data = docs;
            res.render('index', polls);
            db.close();
        });
    });
});

app.get('/polls/:STRING', function(req, res) {
    var str = req.params.STRING;
    console.log(str);
    res.redirect('/');
});

app.get('/*', function(req, res) {
    res.redirect('/');
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});

// to do
// error handling
// login
// db
// poll