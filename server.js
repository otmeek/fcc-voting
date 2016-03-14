'use strict';

var express      = require('express');
var mongo        = require('mongodb').MongoClient;
var path         = require('path');
var randomstring = require('randomstring');
var bodyParser   = require('body-parser');
var os           = require('os');
var ifaces       = os.networkInterfaces();

var app = express();
require('dotenv').load();

app.use(express.static(__dirname + '/public'));
app.use('/polls', express.static(__dirname + '/public'));
app.use('/polls/:STRING', express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: false
}));
app.use(bodyParser.json())
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    
    var polls = {};
    
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
       if(err) throw err; 
        
        var collection = db.collection('polls');
        var data = collection.find().sort({
            _id: -1
        }).limit(50).toArray(function(err, docs) {
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

app.post('/polls/create', function(req, res) {
    console.log(req.body);
    var doc = {
        title: req.body.title,
        totalVotes: 0,
        hasVoted: []
    };
    var choices = [];
    for (var prop in req.body) {
        if (req.body.hasOwnProperty(prop)) {
            if (prop.substr(0, 6) == 'choice' && req.body[prop] != '') {
                choices.push(req.body[prop])
            }
        }
    }
    
    doc.choices = choices;
    
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        if(err) throw err; 
        
        var collection = db.collection('polls');
        
        function getNewUrl() {
            // generate new URL
            var urlStr = randomstring.generate(10);
            // check if url already exists
            collection.find({
                url: '/polls/' + urlStr
            }).toArray(function(err, docs) {
                if(err) throw err;
                if(docs.length > 0)
                    getNewUrl();
            });
            return urlStr;
        }
        
        doc.url = '/polls/' + getNewUrl();
        
        collection.insert(doc, function(err) {
            if(err) throw err;
            var obj = {
                pollSubmitted: true,
                poll: {
                    url: process.env.APP_URL + doc.url.substr(1)
                }
            }
            res.render('create', obj);
            db.close();
        });
    });
    
    
});

app.get('/polls/:STRING/vote', function(req, res) {
    var str = req.params.STRING;
    
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        if(err) throw err;
        var collection = db.collection('polls');
        
        
        // if user has voted, redirect to results page
        var ip = [req.ip];
        collection.find({
            url: '/polls/' + str,
            hasVoted: {
                $in: ip
            }
        }).toArray(function(err, docs) {
            if(err) throw err;
            if(docs.length>0) {
                // if there is a result, then user has voted
                console.log('has voted ' + JSON.stringify(docs))
                // redirect to results page
                res.redirect('/polls/' + str + '/results');
                db.close();
            }
            else {
                // user hasnt voted, render vote page
                console.log('hasnt voted: ' + JSON.stringify(docs));
                collection.find({
                    url: /polls/ + str
                }).toArray(function(err, docs) {
                    if(err) throw err;
                    var obj = {
                        poll: docs[0]
                    };
                    res.render('poll', obj);
                    db.close();
                });
            }
        });
    });

});

app.post('/polls/:STRING/vote', function(req, res) {
    var str = req.params.STRING;
    var vote = req.body;
    
    var key = req.body.choice;
    var voteObj = {};
    voteObj[key] = 1;
    voteObj.totalVotes = 1;
    
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        if (err) throw err;
        var collection = db.collection('polls');
        collection.update({
            url: '/polls/' + str
        }, {
            $inc: voteObj,
            $push: {
                hasVoted: {
                    $each: [req.ip]
                }
            }
        }, function(err) {
            if(err) throw err;
            // redirect to results page
            res.redirect('/polls/' + str + '/results');
            db.close();
        });
    });

    
});

app.get('/polls/:STRING/results', function(req, res) {
    var str = req.params.STRING;
    var obj = {};
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        if(err) throw err;
        var collection = db.collection('polls');
        collection.find({
            url: '/polls/' + str
        }).toArray(function(err, doc) {
            obj.poll = doc[0];
            res.render('results', obj);
            db.close();
        });
    });
});

app.get('/polls/:STRING', function(req, res) {
    var urlStr = req.params.STRING;
    // check if user or ip has voted
    // if yes, redirect to results
    // else, redirect to vote page
    res.redirect('/polls/' + urlStr + '/vote');
});

app.get('/data', function(req, res) {
    var query = req.query;
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
    
        var collection = db.collection('polls');
        collection.find({
            url: query.url
        }).toArray(function(err, doc) {
            res.json(doc);
            db.close();
        });
    
    });
    
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