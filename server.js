'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;
var path = require('path');

var app = express();
require('dotenv').load();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    var body = {
        title: 'FreeCodeCamp basejump Build a Voting App',
        h1: 'fcc-voting',
        p1: 'This is a web app project created by otmeek as part of FreeCodeCamp\'s curriculum', 
        p2: 'Here you can vote on other users\' polls and create your own.'
    };
    res.render('index', {
        body: body
    });
});

app.get('/*', function(req, res) {
    res.redirect('/');
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});