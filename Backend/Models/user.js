const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
    firstname : {
        type : String,
        required  : true,
    },
    lastname : {
        type : String,
        required  : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
    },
    role : {
        type : String,
        enum : ["user","admin"] ,
        default : "user",
    },
    contests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
    }],
    // Password reset: only a SHA-256 hash of the emailed token is stored. select:false keeps
    // both fields out of req.user and every normal query.
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
})

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User',UserSchema);