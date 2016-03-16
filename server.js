'use strict';

var express      = require('express');
var path         = require('path');
var bodyParser   = require('body-parser');
var os           = require('os');
var ifaces       = os.networkInterfaces();

var passport     = require('passport');
var flash        = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var mongoose     = require('mongoose');
var bcrypt       = require('bcrypt-nodejs');
var randomstring = require('randomstring');

var Poll         = require('./app/models/poll');
var User         = require('./app/models/user');
var DBconfig     = require('./config/database');

mongoose.connect(DBconfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

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

app.get('/', function(req, res) {

    var polls = {};

//    var collection = req.db.collection('polls');
//    var data = collection.find().sort({
//        _id: -1
//    }).limit(50).toArray(function(err, docs) {
//        if(err) throw err;
//        polls.data = docs;
//        polls.currentPage = 'Home'
//        res.render('index', polls);
//    });
    
    Poll.find().sort({ _id: 'descending'}).limit(50).exec(function(err, polls) {
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
        message    : req.flash('loginMessage')
    }
    res.render('signup', obj);
});

var createHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

app.post('/signup', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

//    var collection = req.db.collection('users');
//    collection.insert({
//        username: username,
//        password: createHash(password)
//    }, function(err) {
//        if(err) throw err;
//        res.redirect('/signin');
//    });
    
    var newUser = new User({
        username: username,
        password: createHash(password)
    });
    
    newUser.save(function(err, user) {
        if(err) throw err;
        res.redirect('/signin');
    });

});

app.get('/profile', function(req, res) {
    res.render('profile', {
        user: 'req.user'
    });
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})

app.get('/polls/create', function(req, res) {
    var obj = {
        currentPage: 'Create'
    }
    res.render('create', obj);
});

app.post('/polls/create', function(req, res) {
    var poll = req.body;

    for (var p in poll) {
      if (poll[p] === null || poll[p] === '') {
        delete poll[p];
      }
    }

    var doc = new Poll({
        title: poll.title,
        totalVotes: 0,
        hasVoted: []
    });
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

    function getNewUrl() {
        // generate new URL
        var urlStr = randomstring.generate(10);
        // check if url already exists
//        collection.find({
//            url: '/polls/' + urlStr
//        }).toArray(function(err, docs) {
//            if(err) throw err;
//            if(docs.length > 0)
//                getNewUrl();
//        });
        
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

//    collection.insert(doc, function(err) {
//        if(err) throw err;
//        var obj = {
//            pollSubmitted: true,
//            poll: {
//                url: process.env.APP_URL + doc.url.substr(1)
//            }
//        }
//        res.render('create', obj);
//    });
    
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


    //var collection = req.db.collection('polls');


    // if user has voted, redirect to results page
    var ip = [req.headers['x-forwarded-for']];
    
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
//    collection.find({
//        url: '/polls/' + str,
//        hasVoted: {
//            $in: ip
//        }
//    }).toArray(function(err, docs) {
//        if(err) throw err;
//        if(docs.length>0) {
//            // redirect to results page
//            res.redirect('/polls/' + str + '/results');
//        }
//        else {
//            // user hasnt voted, render vote page
//            collection.find({
//                url: /polls/ + str
//            }).toArray(function(err, docs) {
//                if(err) throw err;
//                var obj = {
//                    poll: docs[0]
//                };
//                res.render('poll', obj);
//            });
//        }
//    });

});

app.post('/polls/:STRING/vote', function(req, res) {
    var str = req.params.STRING;
    var vote = req.body;
   
    if(JSON.stringify(vote) === JSON.stringify({})) {

//        collection.find({
//                url: /polls/ + str
//            }).toArray(function(err, docs) {
//                if(err) throw err;
//                var obj = {
//                    poll: docs[0],
//                    voteFailed: true
//                };
//                res.render('poll', obj);
//            });
        
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
    }


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

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});