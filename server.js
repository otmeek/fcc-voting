'use strict';

var express      = require('express');
var mongo        = require('mongodb').MongoClient;
var path         = require('path');
var randomstring = require('randomstring');
var bodyParser   = require('body-parser');
var os           = require('os');
var ifaces       = os.networkInterfaces();

var app = express();
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

require('dotenv').load();

app.use(express.static(__dirname + '/public'));
app.use('/polls', express.static(__dirname + '/public'));
app.use('/polls/:STRING', express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: false
}));
app.use(bodyParser.json())
app.set('view engine', 'jade');

app.get('/', passDb, function(req, res) {
    
    var polls = {};
    
    var collection = req.db.collection('polls');
    var data = collection.find().sort({
        _id: -1
    }).limit(50).toArray(function(err, docs) {
        if(err) throw err;
        polls.data = docs;
        polls.currentPage = 'Home'
        res.render('index', polls);
    });
});

app.get('/polls/create', function(req, res) {
    var obj = {
        currentPage: 'Create'
    }
    res.render('create', obj);
});

app.post('/polls/create', passDb, function(req, res) {
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

    var collection = req.db.collection('polls');

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
    });
    
    
});

app.get('/polls/:STRING/vote', passDb, function(req, res) {
    var str = req.params.STRING;
    

    var collection = req.db.collection('polls');
        
        
    // if user has voted, redirect to results page
    var ip = [req.headers['x-forwarded-for']];
    collection.find({
        url: '/polls/' + str,
        hasVoted: {
            $in: ip
        }
    }).toArray(function(err, docs) {
        if(err) throw err;
        if(docs.length>0) {
            // redirect to results page
            res.redirect('/polls/' + str + '/results');
        }
        else {
            // user hasnt voted, render vote page
            collection.find({
                url: /polls/ + str
            }).toArray(function(err, docs) {
                if(err) throw err;
                var obj = {
                    poll: docs[0]
                };
                res.render('poll', obj);
            });
        }
    });

});

app.post('/polls/:STRING/vote', passDb, function(req, res) {
    var str = req.params.STRING;
    var vote = req.body;
    console.log(vote);
    
    var key = vote.choice;
    var voteObj = {};
    voteObj[key] = 1;
    voteObj.totalVotes = 1;
    
    if(vote.hasOwnProperty('newOption')) {
        console.log(vote.hasOwnProperty('newOption'));
    }
    
    var pushObj = {
        hasVoted: {
            $each: [req.headers['x-forwarded-for']]
        },
        choices: {
            $each: [vote.newOption]
        }
    }
    
   
    var collection = req.db.collection('polls');
    collection.update({
        url: '/polls/' + str
    }, {
        $inc: voteObj,
        $push: {
            hasVoted: {
                $each: [req.headers['x-forwarded-for']]
            },
            choices: {
                $each: [vote.newOption]
            }
        }
    }, function(err) {
        if(err) throw err;
        // redirect to results page
        res.redirect('/polls/' + str + '/results');
    });

    
});

app.get('/polls/:STRING/results', passDb, function(req, res) {
    var str = req.params.STRING;
    var obj = {};

    var collection = req.db.collection('polls');
    collection.find({
        url: '/polls/' + str
    }).toArray(function(err, doc) {
        obj.poll = doc[0];
        res.render('results', obj);
    });

});

app.get('/data', passDb, function(req, res) {
    var query = req.query;
       
    var collection = req.db.collection('polls');
    collection.find({
        url: query.url
    }).toArray(function(err, doc) {
        res.json(doc);
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