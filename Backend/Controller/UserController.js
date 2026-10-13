const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../Models/user.js');
const { sendMail } = require('../utils/mailer');
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
        const { password, hash, salt, ...userSafe } = req.user.toObject ? req.user.toObject() : req.user;
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

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BAD_LINK = 'This reset link is invalid or has expired. Request a new one.';

exports.forgotPassword = async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    // Always answer the same way, and answer first, so neither the response nor its timing
    // reveals whether an account exists for this address.
    res.json({ message: 'If an account exists for that email, a reset link is on its way.' });

    try {
        const user = await User.findOne({ email: new RegExp('^' + escapeRegex(email) + '$', 'i') });
        if (!user) return;

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordTokenHash = sha256(token);
        user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await user.save();

        const base = (process.env.FRONTEND_URL || process.env.FRONTEND_URL_LOCAL || '').replace(/\/$/, '');
        if (!base) console.error('forgotPassword: FRONTEND_URL is not set, the reset link will be broken.');
        const link = `${base}/reset-password?token=${token}`;
        const minutes = RESET_TOKEN_TTL_MS / 60000;

        await sendMail({
            to: user.email,
            subject: 'Reset your CodeArena password',
            text: `Hi ${user.firstname},\n\nUse this link to choose a new password (valid for ${minutes} minutes):\n${link}\n\n` +
                'If you did not ask for this, you can ignore this email - your password will not change.\n\n- CodeArena',
            html: '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;color:#1f2328">' +
                '<h2 style="margin:0 0 12px">Reset your password</h2>' +
                `<p>Hi ${user.firstname},</p>` +
                `<p>Use the button below to choose a new password. The link is valid for ${minutes} minutes.</p>` +
                `<p style="margin:24px 0"><a href="${link}" style="background:#ffa116;color:#1f1300;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">Choose a new password</a></p>` +
                `<p style="font-size:13px;color:#6b7280">Or paste this link into your browser:<br>${link}</p>` +
                '<p style="font-size:13px;color:#6b7280">If you did not ask for this, you can ignore this email - your password will not change.</p></div>',
        });
    } catch (err) {
        // the client already got its answer; just record the failure
        console.error('forgotPassword failed:', err.message);
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
            return res.status(400).json({ message: BAD_LINK });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const user = await User.findOne({
            resetPasswordTokenHash: sha256(token),
            resetPasswordExpires: { $gt: new Date() },
        }).select('+resetPasswordTokenHash +resetPasswordExpires');
        if (!user) return res.status(400).json({ message: BAD_LINK });

        await user.setPassword(password); // passport-local-mongoose: new salt + hash
        user.resetPasswordTokenHash = undefined; // one use only
        user.resetPasswordExpires = undefined;
        await user.save();

        // Sign the account out everywhere: remove stored sessions that belong to this user.
        try {
            await mongoose.connection.collection('sessions').deleteMany({
                session: { $regex: '"user":"' + escapeRegex(user.email) + '"' },
            });
        } catch (e) {
            console.error('resetPassword: could not clear old sessions:', e.message);
        }

        res.json({ message: 'Password updated. You can now log in with your new password.' });
    } catch (err) {
        console.error('resetPassword failed:', err.message);
        res.status(500).json({ message: 'Could not reset your password. Please try again.' });
    }
};
