'use strict';

var randomstring = require('randomstring');

module.exports = function(app, passport, passDb) {     

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

    app.get('/signin', function(req, res) {
        var obj = {
            currentPage: 'Signin'
        }
        res.render('signin', obj);
    });

    app.get('/signup', function(req, res) {
        var obj = {
            currentPage: 'Signup'
        }
        res.render('signup', obj);
    });

    app.get('/user/:USERNAME', function(req, res) {
        // check that user is logged in?
    });

    app.get('/polls/create', function(req, res) {
        var obj = {
            currentPage: 'Create'
        }
        res.render('create', obj);
    });

    app.post('/polls/create', passDb, function(req, res) {
        var poll = req.body;

        for (var p in poll) {
          if (poll[p] === null || poll[p] === '') {
            delete poll[p];
          }
        }

        var doc = {
            title: poll.title,
            totalVotes: 0,
            hasVoted: []
        };
        var choices = [];
        for (var prop in poll) {
            if (poll.hasOwnProperty(prop)) {
                if (prop.substr(0, 6) == 'choice' && poll[prop] != '') {
                    console.log(poll[prop])
                    choices.push(poll[prop])
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

    app.get('/polls/:STRING', function(req, res) {
        var str = req.params.STRING;
        res.redirect('/polls/' + str + '/vote');
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
        var collection = req.db.collection('polls');
        if(JSON.stringify(vote) === JSON.stringify({})) {
            
            collection.find({
                    url: /polls/ + str
                }).toArray(function(err, docs) {
                    if(err) throw err;
                    var obj = {
                        poll: docs[0],
                        voteFailed: true
                    };
                    res.render('poll', obj);
                });
            
        }
        else {

            var key = vote.choice;
            var voteObj = {};
            voteObj[key] = 1;
            voteObj.totalVotes = 1;
            var pushObj = {
                hasVoted: {
                    $each: [req.headers['x-forwarded-for']]
                }
            }

            if(vote.hasOwnProperty('newOption')) {
                console.log(vote.hasOwnProperty('newOption'));
                pushObj = {
                    hasVoted: {
                        $each: [req.headers['x-forwarded-for']]
                    },
                    choices: {
                        $each: [vote.newOption]
                    }
                }
            }

            collection.update({
                url: '/polls/' + str
            }, {
                $inc: voteObj,
                $push: pushObj
            }, function(err) {
                if(err) throw err;
                // redirect to results page
                res.redirect('/polls/' + str + '/results');
            });
        }


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
}