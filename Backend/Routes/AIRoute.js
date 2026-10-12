require('dotenv').config();
const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middleware.js');
const Contest = require('../Models/Contests.js');
const Problem = require('../Models/Problems.js');
const Submission = require('../Models/Submissions.js');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.Gemini_api });
const AIController = require('../Controller/AIController');

router.post('/review', AIController.reviewCode);
router.post('/createProblem', AIController.createProblemAI);
router.post('/debug', AIController.debugCode);
router.post('/contest-description', AIController.generateContestDescription);
router.post('/chat', AIController.chat);
router.post('/problem-chat', AIController.problemChat);

router.post('/generate-problem', AIController.generateProblem);

module.exports = router;