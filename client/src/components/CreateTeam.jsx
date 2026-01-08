import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

const CreateTeam = ({ onClose, onTeamCreated }) => {
    const [teamName, setTeamName] = useState('');
    const [emails, setEmails] = useState(['']);
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
                const res = await fetch(`http://localhost:9000/api/team/search-users?query=${encodeURIComponent(query)}`, {
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
            const validEmails = emails.filter(email => email.trim() !== '');

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: teamName,
                    inviteEmails: validEmails
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create team');
            }

            // Show success toast
            const inviteCount = validEmails.length;
            if (inviteCount > 0) {
                toast.success(`Team created! ${inviteCount} invitation${inviteCount > 1 ? 's' : ''} sent via email.`);
            } else {
                toast.success('Team created successfully!');
            }

            onTeamCreated(data.team);
            onClose();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
                    <h2 className="text-xl font-bold text-white">Create Team</h2>
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

                    {/* Email Invitations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#8b949e]">
                                Invite Members (Optional)
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
                                        <div className="absolute z-10 w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg shadow-xl max-h-48 overflow-y-auto">
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !teamName.trim()}
                        className="w-full bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3ecf8e]/20"
                    >
                        {loading ? 'Creating...' : 'Create Team'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTeam;
