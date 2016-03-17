'use strict';

var mongoose = require('mongoose');

var pollSchema = mongoose.Schema({
    
    
    title: String,
    hasVoted: [],
    choices: [],
    totalVotes: Number,
    url: String,
    choice0: Number,
    choice1: Number,
    choice2: Number,
    choice3: Number,
    choice4: Number,
    choice5: Number,
    choice6: Number,
    choice7: Number,
    choice8: Number,
    choice9: Number,
    createdBy: String
    
    
}, {
    timestamps: true
});

// create the model for users and export to app
module.exports = mongoose.model('Poll', pollSchema);