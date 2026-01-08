const express = require('express');
const crypto = require('crypto');
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendTeamInvitation } = require('../utils/emailService');

const router = express.Router();

// Create a new team
router.post('/create', auth, async (req, res) => {
    try {
        const { name, inviteEmails } = req.body;
        const userId = req.user;

        // Check if user already has a team
        const user = await User.findById(userId);
        if (user.teamId) {
            return res.status(400).json({ message: 'You are already in a team' });
        }

        // Create the team
        const teamData = {
            name,
            owner: userId,
            members: [userId]
        };

        // Only add invitations if emails are provided
        if (inviteEmails && inviteEmails.length > 0) {
            teamData.invitations = inviteEmails.map(email => ({
                email,
                token: crypto.randomBytes(32).toString('hex'),
                status: 'pending'
            }));
        }

        const team = new Team(teamData);
        await team.save();

        // Send invitation emails if any
        if (inviteEmails && inviteEmails.length > 0) {
            const emailPromises = inviteEmails.map(async (email, index) => {
                try {
                    await sendTeamInvitation(email, team.name, teamData.invitations[index].token);
                } catch (emailError) {
                    console.error(`Failed to send email to ${email}:`, emailError);
                }
            });
            await Promise.all(emailPromises);
        }

        // Update user's teamId
        user.teamId = team._id;
        await user.save();

        res.status(201).json({
            message: 'Team created successfully',
            team
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's team
router.get('/my-team', auth, async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);

        if (!user.teamId) {
            return res.status(404).json({ message: 'No team found' });
        }

        const team = await Team.findById(user.teamId)
            .populate('owner', 'username email profilePicture')
            .populate('members', 'username email profilePicture');

        res.json(team);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search users by email
router.get('/search-users', auth, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.json([]);
        }

        // Search for users by email (case-insensitive)
        const users = await User.find({
            email: { $regex: query, $options: 'i' }
        })
            .select('email username profilePicture')
            .limit(5);

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Invite members to team
router.post('/invite', auth, async (req, res) => {
    try {
        const { emails } = req.body;
        const userId = req.user;

        console.log('=== INVITE ROUTE CALLED ===');
        console.log('User ID:', userId);
        console.log('Emails to invite:', emails);

        const user = await User.findById(userId);
        if (!user.teamId) {
            return res.status(400).json({ message: 'You are not in a team' });
        }

        const team = await Team.findById(user.teamId);
        if (team.owner.toString() !== userId) {
            return res.status(403).json({ message: 'Only team owner can invite members' });
        }

        console.log('Team found:', team.name);
        console.log('Team owner verified');

        // Generate tokens and send emails
        const invitationPromises = emails.map(async (email) => {
            const token = crypto.randomBytes(32).toString('hex');

            console.log(`Processing invitation for: ${email}`);

            // Add invitation to team
            team.invitations.push({
                email,
                token,
                status: 'pending'
            });

            // Send email
            try {
                console.log(`Attempting to send email to: ${email}`);
                await sendTeamInvitation(email, team.name, token);
                console.log(`✅ Email sent successfully to: ${email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send email to ${email}:`, emailError.message);
            }
        });

        await Promise.all(invitationPromises);
        await team.save();

        console.log('Team saved with new invitations');
        console.log('Total invitations now:', team.invitations.length);

        res.json({
            message: 'Invitations sent successfully',
            team
        });
    } catch (error) {
        console.error('❌ Error in invite route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update team name
router.put('/update', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user;

        const user = await User.findById(userId);
        if (!user.teamId) {
            return res.status(400).json({ message: 'You are not in a team' });
        }

        const team = await Team.findById(user.teamId);
        if (team.owner.toString() !== userId) {
            return res.status(403).json({ message: 'Only team owner can update team' });
        }

        team.name = name;
        await team.save();

        res.json({
            message: 'Team updated successfully',
            team
        });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's pending invitations
router.get('/my-invitations', auth, async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);

        // Find teams where user has pending invitations
        const teams = await Team.find({
            'invitations.email': user.email,
            'invitations.status': 'pending'
        }).populate('owner', 'username email profilePicture');

        const invitations = teams.map(team => {
            const invitation = team.invitations.find(
                inv => inv.email === user.email && inv.status === 'pending'
            );
            return {
                teamId: team._id,
                teamName: team.name,
                owner: team.owner,
                token: invitation.token,
                invitedAt: invitation.invitedAt
            };
        });

        res.json(invitations);
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept team invitation
router.post('/accept-invitation/:token', auth, async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user;

        const user = await User.findById(userId);

        // Check if user already has a team
        if (user.teamId) {
            return res.status(400).json({ message: 'You are already in a team' });
        }

        // Find team with this invitation token
        const team = await Team.findOne({
            'invitations.token': token,
            'invitations.email': user.email,
            'invitations.status': 'pending'
        });

        if (!team) {
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        // Update invitation status
        const invitation = team.invitations.find(inv => inv.token === token);
        invitation.status = 'accepted';

        // Add user to team members
        team.members.push(userId);
        await team.save();

        // Update user's teamId
        user.teamId = team._id;
        await user.save();

        res.json({
            message: 'Invitation accepted successfully',
            team
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete team (owner only)
router.delete('/delete', auth, async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);

        if (!user.teamId) {
            return res.status(400).json({ message: 'You are not in a team' });
        }

        const team = await Team.findById(user.teamId);
        if (team.owner.toString() !== userId) {
            return res.status(403).json({ message: 'Only team owner can delete the team' });
        }

        // Remove teamId from all members
        await User.updateMany(
            { teamId: team._id },
            { $set: { teamId: null } }
        );

        // Delete the team
        await Team.findByIdAndDelete(team._id);

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave team (members only, not owner)
router.post('/leave', auth, async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);

        if (!user.teamId) {
            return res.status(400).json({ message: 'You are not in a team' });
        }

        const team = await Team.findById(user.teamId);

        // Owner cannot leave, must delete team instead
        if (team.owner.toString() === userId) {
            return res.status(403).json({ message: 'Team owner cannot leave. Delete the team instead.' });
        }

        // Remove user from team members
        team.members = team.members.filter(memberId => memberId.toString() !== userId);
        await team.save();

        // Remove teamId from user
        user.teamId = null;
        await user.save();

        res.json({ message: 'Successfully left the team' });
    } catch (error) {
        console.error('Error leaving team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
