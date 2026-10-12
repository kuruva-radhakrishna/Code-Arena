const User = require('../Models/user.js');
const { validateUser } = require('../validators/userValidation');

exports.register = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        // Never trust a role sent by the client: self-registration always creates a normal user.
        // (Admins are promoted directly in the database.)
        const role = 'user';
        const err = validateUser({ firstname, lastname, email, password, role });
        if (err) {
            return res.status(400).json({ message: err });
        }
        const newUser = new User({ firstname, lastname, email, role });
        const existinguser = await User.findOne({ email });
        if (existinguser) {
            return res.status(400).json({ "message": `user with the email ${email} already exists` });
        }
        const user = await User.register(newUser, password);
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed after registration' });
            }
            const { password, ...userSafe } = user.toObject ? user.toObject() : user;
            res.json({ message: `Welcome back ${user.firstname + " " + user.lastname} `, user: userSafe });
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' })
    }
};

exports.login = (req, res, next) => {
    const passport = require('passport');
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Server Error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login Failed' });
            }

            // 🔧 Force session save before sending response
            req.session.save((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Session save failed' });
                }

                const { password, hash, salt, ...userSafe } = user.toObject ? user.toObject() : user;
                res.json({
                    message: `Welcome back ${user.firstname} ${user.lastname}`,
                    user: userSafe,
                });
            });
        });
    })(req, res, next);
};


exports.checkAuth = (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        const { password, ...userSafe } = req.user.toObject ? req.user.toObject() : req.user;
        res.json({ user: userSafe });
    } else {
        res.status(401).json({ user: null });
    }
};

exports.logout = (req, res) => {
    req.logout(function(err) {
        if (err) { return res.status(500).json({ error: 'Logout failed' }); }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
};

exports.getProfile = async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ user: null });
    }
    try {
        const attendedContests = await require('../Models/Contests').find({
            'leaderBoard.user_id': req.user._id
        }).select('contestTitle startTime endTime description leaderBoard');
        const attended = attendedContests.map(contest => {
            const entry = contest.leaderBoard.find(e => e.user_id && e.user_id.toString() === req.user._id.toString());
            return {
                ...contest.leaderBoard,
                leaderBoard: entry ? [entry] : [],
            };
        });
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ user: null });
        const { password, contests, ...userSafe } = user.toObject ? user.toObject() : user;
        userSafe.attendedContests = attended;
        res.json({ user: userSafe });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}; 
