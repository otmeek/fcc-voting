'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;
var path = require('path');
var randomstring = require('randomstring');

var app = express();
require('dotenv').load();

app.use(express.static(__dirname + '/public'));
app.use('/polls', express.static(__dirname + '/public'))
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    
    var polls = {};
    
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
       if(err) throw err; 
        
        var collection = db.collection('polls');
        var data = collection.find().toArray(function(err, docs) {
            if(err) throw err;
            polls.data = docs;
            polls.currentPage = 'Home'
            res.render('index', polls);
            db.close();
        });
    });
});

app.get('/polls/create', function(req, res) {
    var obj = {
        currentPage: 'Create'
    }
    res.render('create', obj);
});

app.get('/polls/:STRING', function(req, res) {
    var str = req.params.STRING;
    // logic here
    res.redirect('/');
});

app.get('/*', function(req, res) {
    // redirect invalid paths to main page
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