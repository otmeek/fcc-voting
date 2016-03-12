'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;
var path = require('path');

var app = express();
require('dotenv').load();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    var polls = {
        data: [
            {
                title: 'poll1',
                url: '#'
            },
            {
                title: 'poll2',
                url: '#'
            }
        ]
    };
    res.render('index', polls);
});

app.get('/*', function(req, res) {
    res.redirect('/');
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});