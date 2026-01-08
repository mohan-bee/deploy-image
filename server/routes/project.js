const express = require('express');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const router = express.Router();

// Record a new deployment
router.post('/record', auth, async (req, res) => {
    try {
        const { name, image, port, url, teamId } = req.body;
        const userId = req.user;

        const project = new Project({
            name,
            image,
            port,
            url,
            owner: userId,
            teamId: teamId || null
        });

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error('Error recording project:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get projects for current user and their team
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user;
        const { teamId } = req.query;

        let query = {
            $or: [
                { owner: userId },
                { teamId: teamId || null }
            ]
        };

        const projects = await Project.find(query)
            .sort({ createdAt: -1 });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
