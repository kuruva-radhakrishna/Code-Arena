const express = require('express');
const router = express.Router();
const UserController = require('../Controller/UserController');
const { isLoggedIn } = require('../middleware');
const rateLimit = require('express-rate-limit');

// Brute-force / abuse protection for the password-reset endpoints (per IP).
const limiter = (max) => rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

// Register route
router.post('/register', UserController.register);

router.post('/login', UserController.login);

// Forgot / reset password
router.post('/forgot-password', limiter(5), UserController.forgotPassword);
router.post('/reset-password', limiter(10), UserController.resetPassword);

// Check authentication status
router.get('/auth/check', UserController.checkAuth);

// Logout route
router.post('/logout', UserController.logout);

// Get current user's profile with attended contests (by leaderboard presence)
router.get('/profile', isLoggedIn, UserController.getProfile);

module.exports = router;