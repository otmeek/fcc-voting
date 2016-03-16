'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    
    
    username: String,
    password: String,
    
    
});

// create the model for users and export to app
module.exports = mongoose.model('User', userSchema);