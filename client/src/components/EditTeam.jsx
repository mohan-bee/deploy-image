import React, { useState, useRef } from 'react';
import { X, Mail, Plus, Trash2, Save, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const EditTeam = ({ team, onClose, onTeamUpdated }) => {
    const [teamName, setTeamName] = useState(team.name);
    const [emails, setEmails] = useState(['']); // Start with one empty field for new invitations
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeSearchIndex, setActiveSearchIndex] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimeoutRef = useRef(null);

    const addEmailField = () => {
        setEmails([...emails, '']);
    };

    const removeEmailField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
        if (activeSearchIndex === index) {
            setActiveSearchIndex(null);
            setSearchResults([]);
        }
    };

    const updateEmail = (index, value) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);

        // Trigger search
        if (value.length >= 2) {
            setActiveSearchIndex(index);
            searchUsers(value);
        } else {
            setSearchResults([]);
            setActiveSearchIndex(null);
        }
    };

    const searchUsers = async (query) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/search-users?query=${encodeURIComponent(query)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const users = await res.json();
                    setSearchResults(users);
                }
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    };

    const selectUser = (index, user) => {
        const newEmails = [...emails];
        newEmails[index] = user.email;
        setEmails(newEmails);
        setSearchResults([]);
        setActiveSearchIndex(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = sessionStorage.getItem('token');

            // Update team name if changed
            if (teamName !== team.name) {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: teamName })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to update team');
                }
            }

            // Send new invitations
            const validEmails = emails.filter(email => email.trim() !== '');

            // Get existing invitations and current member emails
            const existingInvitationEmails = team.invitations?.map(inv => inv.email) || [];
            const currentMemberEmails = team.members?.map(member => member.email) || [];
            const allExistingEmails = [...existingInvitationEmails, ...currentMemberEmails];

            // Filter out emails that are already invited or are current members
            const newEmails = validEmails.filter(email => !allExistingEmails.includes(email));

            console.log('Valid emails:', validEmails);
            console.log('Existing invitations:', existingInvitationEmails);
            console.log('Current members:', currentMemberEmails);
            console.log('New emails to invite:', newEmails);

            if (newEmails.length > 0) {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/invite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ emails: newEmails })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to send invitations');
                }

                toast.success(`${newEmails.length} invitation${newEmails.length > 1 ? 's' : ''} sent via email!`);
            } else if (validEmails.length > 0) {
                toast.info('All entered emails are already invited or are current members');
            }

            // Fetch updated team
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/my-team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedTeam = await res.json();

            if (teamName !== team.name && newEmails.length === 0 && validEmails.length === 0) {
                toast.success('Team updated successfully!');
            }

            onTeamUpdated(updatedTeam);
            onClose();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Failed to update team');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Team deleted successfully');
                onTeamUpdated(null);
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete team');
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            toast.error('Failed to delete team');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm('Are you sure you want to leave this team?')) {
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Successfully left the team');
                onTeamUpdated(null);
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to leave team');
            }
        } catch (error) {
            console.error('Error leaving team:', error);
            toast.error('Failed to leave team');
        } finally {
            setLoading(false);
        }
    };

    // Check if current user is team owner
    const currentUserId = JSON.parse(sessionStorage.getItem('user') || '{}')._id;
    const isOwner = team.owner._id === currentUserId;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#30363d] sticky top-0 bg-[#161b22] z-10">
                    <h2 className="text-xl font-bold text-white">Edit Team</h2>
                    <button
                        onClick={onClose}
                        className="text-[#8b949e] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Team Name */}
                    <div>
                        <label className="block text-sm font-medium text-[#8b949e] mb-2">
                            Team Name
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent"
                            placeholder="Enter team name"
                        />
                    </div>

                    {/* Current Members */}
                    {team.members && team.members.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-[#8b949e] mb-2">
                                Current Members ({team.members.length})
                            </label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {team.members.map((member) => (
                                    <div key={member._id} className="flex items-center space-x-2 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2">
                                        <img src={member.profilePicture} alt={member.username} className="w-6 h-6 rounded-full" />
                                        <span className="text-white text-sm">{member.username}</span>
                                        <span className="text-[#8b949e] text-xs">({member.email})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email Invitations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#8b949e]">
                                Invite More Members
                            </label>
                            <button
                                type="button"
                                onClick={addEmailField}
                                className="text-[#3ecf8e] hover:text-[#3ecf8e]/80 text-sm flex items-center space-x-1"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {emails.map((email, index) => (
                                <div key={index} className="relative">
                                    <div className="flex items-center space-x-2">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => updateEmail(index, e.target.value)}
                                                onFocus={() => email.length >= 2 && setActiveSearchIndex(index)}
                                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent"
                                                placeholder="member@example.com"
                                            />
                                        </div>
                                        {emails.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeEmailField(index)}
                                                className="text-[#8b949e] hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {activeSearchIndex === index && searchResults.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {searchResults.map((user) => (
                                                <button
                                                    key={user._id}
                                                    type="button"
                                                    onClick={() => selectUser(index, user)}
                                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-[#161b22] transition-colors text-left"
                                                >
                                                    <img
                                                        src={user.profilePicture}
                                                        alt={user.username}
                                                        className="w-8 h-8 rounded-full border border-[#30363d]"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{user.username}</p>
                                                        <p className="text-[#8b949e] text-xs truncate">{user.email}</p>
                                                    </div>
                                                    <User className="w-4 h-4 text-[#3ecf8e]" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Loading indicator */}
                                    {activeSearchIndex === index && searchLoading && (
                                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={loading || !teamName.trim()}
                            className="w-full bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3ecf8e]/20 flex items-center justify-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        </button>

                        {/* Delete Team (Owner Only) or Leave Team (Members) */}
                        {isOwner ? (
                            <button
                                type="button"
                                onClick={handleDeleteTeam}
                                disabled={loading}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Team</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleLeaveTeam}
                                disabled={loading}
                                className="w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/30 text-orange-400 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Leave Team</span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTeam;
