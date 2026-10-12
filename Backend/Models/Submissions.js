const  mongoose = require('mongoose');

const SubmissionSchema = mongoose.Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    problem_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Problem',
        required : true,
    },
    contest_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Contest',
    },
    language : {
        type : String,
        enum : ["c","cpp","python","java"],
        required : true,
    },
    code : {
        type : String,
        required : true,
    },
    verdict : {
        type : String,
        required : true,
    },
    submittedAt : {
        type : Date,
        default : Date.now,
    },
    executionTime : {
        type : Number,
    },
    memoryUsed : {
        type : Number,
    },
    isInContest : {
        type : Boolean,
        default : false
    }
});

module.exports = mongoose.model('Submission',SubmissionSchema);