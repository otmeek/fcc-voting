'use strict';

var LocalStrategy = require('passport-local').Strategy;
var User          = require('../app/models/user');
var bcrypt        = require('bcrypt-nodejs');

module.exports = function(passport) {
    
    
    passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        
        var isValidPassword = function(user, password) {
            //return bcrypt.compareSync(password, user.password);
            return password === user.password;
        }  
        
        User.findOne({ 'username' : username }, function(err, user) {
            if (err) return done(err);

            // checks to see if user with this username already exists
            if(!user) {
                console.log('User not found with username ' + username);
                return done(null, false, req.flash('message', 'The entered username is invalid.'));
            }
            if(!isValidPassword(user, password)) {
                console.log('Invalid password');
                return done(null, false, req.flash('message', 'Invalid password.'));
            }
            
            // user and pw both match, return user
            return done(null, user);
        });

        
    }));
    
}