'use strict';

var randomstring = require('randomstring');
var Poll         = require('../models/poll');
var User         = require('../models/user');

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/signin');
}

module.exports = function(app, passport) {    

    app.get('/', function(req, res) {

        var polls = {};

        Poll.find().sort({ createdAt: 'descending'}).limit(50).exec(function(err, polls) {
            if(err) throw err;
            polls.data = polls;
            polls.currentPage = 'Home';
            res.render('index', polls);
        });
    });

    app.get('/signin', function(req, res) {
        var obj = {
            currentPage: 'Signin',
            message    : req.flash('message')
        }
        res.render('signin', obj);
    });
    
    app.post('/signin', passport.authenticate('login', {
        successRedirect: '/profile',
        failureRedirect: '/signin',
        failureFlash   : true
    }));

    app.get('/signup', function(req, res) {
        var obj = {
            currentPage: 'Signup',
            message    : req.flash('message')
        }
        res.render('signup', obj);
    });
    
    app.post('/signup', passport.authenticate('signup', {
        successRedirect: '/polls/create',
        failureRedirect: '/signup',
        failureFlash   : true
    }));
    
    app.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/signedout');
    });
    
    app.get('/signedout', function(req, res) {
        res.render('signedout');
    });

    app.get('/profile', isAuthenticated, function(req, res) {
        // list every poll created by user
        // list every poll the user has voted on
        
        var obj = {
            user: req.user.username
        };
        
        Poll.find({
            createdBy: req.user.username
        }).lean().exec(function(err, polls) {
            if(err) throw err;
            obj.createdPolls = polls;
            
            Poll.find({
                hasVoted: {
                    $in: [req.user.username]
                },
                createdBy: {
                    $ne: req.user.username
                }
            }).lean().exec(function(err, polls) {
                if(err) throw err;
                obj.votedPolls = polls;
                res.render('profile', obj);
            });
        });
        

    });

    app.get('/polls/create', isAuthenticated, function(req, res) {
        var obj = {
            currentPage: 'Create'
        }
        res.render('create', obj);
    });

    app.post('/polls/create', isAuthenticated, function(req, res) {
        var poll = req.body;

        for (var p in poll) {
          if (poll[p] === null || poll[p] === '') {
            delete poll[p];
          }
        }

        var doc = new Poll({
            title: poll.title,
            totalVotes: 0,
            hasVoted: [],
            createdBy: req.user.username
        });
        var choices = [];
        for (var prop in poll) {
            if (poll.hasOwnProperty(prop)) {
                if (prop.substr(0, 6) == 'choice' && poll[prop] != '') {
                    choices.push(poll[prop])
                }
            }
        }

        doc.choices = choices;

        function getNewUrl() {
            // generate new URL
            var urlStr = randomstring.generate(10);

            Poll.find({
                url: '/polls/' + urlStr
            }).lean().exec(function(err, docs) {
                if(err) throw err;
                if(docs.length > 0)
                    getNewUrl();
            });

            return urlStr;
        }

        doc.url = '/polls/' + getNewUrl();

        doc.save(function(err, poll) {
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

    app.get('/polls/:STRING/vote', function(req, res) {
        var str = req.params.STRING;

        // if user has voted, redirect to results page
        
        // get ip
        var ip = [req.headers['x-forwarded-for']];
        // get username if user is logged on
        var username = null;
        if (req.user != undefined) {
            username = req.user.username;
        }

        if(username == null) {
            Poll.find({
                url: '/polls/' + str,
                hasVoted : {
                    $in: ip
                }
            }).lean().exec(function(err, polls) {
                    if(err) throw err;
                    if(polls.length > 0) {
                        // redirect to results page
                        res.redirect('/polls/' + str + '/results');
                    }
                    else {
                        // user hasnt voted, render vote page
                        Poll.find({
                            url: '/polls/' + str
                        }).lean().exec(function(err, docs) {
                            if(err) throw err;
                            var obj = {
                                poll: docs[0]
                            };
                            res.render('poll', obj);
                        })
                    }
            });
        }
        else {
            Poll.find({
                url: '/polls/' + str,
                hasVoted: {
                    $in: [username]
                }
            }).lean().exec(function(err, poll) {
                if(err) throw err;
                if(poll.length > 0)
                    res.redirect('/polls/' + str + '/results');
                else {
                    Poll.find({
                        url: '/polls/' + str
                    }).lean().exec(function(err, docs) {
                        if(err) throw err;
                        var obj = {
                            poll: docs[0]
                        };
                        res.render('poll', obj);
                    })
                }
                    
            });
        }

    });

    app.post('/polls/:STRING/vote', function(req, res) {
        var str = req.params.STRING;
        var vote = req.body;

        var username = null;
        if (req.user != undefined) {
            username = req.user.username;
        }
        
        if(JSON.stringify(vote) === JSON.stringify({})) {

            // user has submitted empty vote
            Poll.find({
                url: '/polls/' + str
            }).lean().exec(function(err, docs) {
                if(err) throw err;
                var obj = {
                    poll: docs[0],
                    voteFailed: true
                };
                res.render('poll', obj);
            })

        }
        else {
            
            var key = vote.choice;
            var voteObj = {};
            voteObj[key] = 1;
            voteObj.totalVotes = 1;
            
            if(username == null) {
                var pushObj = {
                    hasVoted: {
                        $each: [req.headers['x-forwarded-for']]
                    }
                }

            }
            else {
                var pushObj = {
                    hasVoted: {
                        $each: [username]
                    }
                }
            }
            
            if(vote.hasOwnProperty('newOption')) {
                pushObj.choices = {
                        $each: [vote.newOption]
                    }
                }
            }

            Poll.update({
                url: '/polls/' + str
            }, {
                $inc: voteObj,
                $push: pushObj
            }, function(err) {
                if(err) throw err;
                // redirect to results page
                res.redirect('/polls/' + str + '/results');
            });


    });

    app.get('/polls/:STRING/results', function(req, res) {
        var str = req.params.STRING;
        var obj = {};

        Poll.find({
            url: '/polls/' + str
        }).lean().exec(function(err, doc) {
            obj.poll = doc[0];
            res.render('results', obj);
        });

    });

    app.get('/*', function(req, res) {
        // redirect invalid paths to main page
        res.redirect('/');
    });
}
