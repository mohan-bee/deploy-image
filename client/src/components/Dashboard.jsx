import React, { useState, useEffect } from 'react';
import { LogOut, Users, Plus, Settings, Mail, Check, X, Globe, Server } from 'lucide-react';
import { toast } from 'sonner';
import CreateTeam from './CreateTeam';
import EditTeam from './EditTeam';
import SystemInfoDialog from './SystemInfoDialog';
import DeployDialog from './DeployDialog';
import { Rocket } from 'lucide-react';

const Dashboard = ({ onLogout }) => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const [team, setTeam] = useState(null);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showEditTeam, setShowEditTeam] = useState(false);
    const [serverOnline, setServerOnline] = useState(false);
    const [systemData, setSystemData] = useState(null);
    const [showSystemInfo, setShowSystemInfo] = useState(false);
    const [showDeployDialog, setShowDeployDialog] = useState(false);
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);

    useEffect(() => {
        fetchTeam();
        fetchInvitations();
        fetchSystemData();
        fetchProjects();

        // Fetch system data every 60 seconds (1 minute)
        const interval = setInterval(fetchSystemData, 1500);
        return () => clearInterval(interval);
    }, [team?._id]);

    const fetchSystemData = async () => {
        try {
            const res = await fetch('https://sys.mohandev.me/api/system');
            if (res.ok) {
                const data = await res.json();
                setSystemData(data);
                setServerOnline(true);
            } else {
                setServerOnline(false);
            }
        } catch (error) {
            console.error('Error fetching system data:', error);
            setServerOnline(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/team/my-team', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setTeam(data);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/team/my-invitations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (error) {
            console.error('Error fetching invitations:', error);
        }
    };
    const fetchProjects = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const url = team ? `http://localhost:8080/api/project?teamId=${team._id}` : 'http://localhost:8080/api/project';
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setProjectsLoading(false);
        }
    };

    const handleAcceptInvitation = async (token, teamName) => {
        try {
            const authToken = sessionStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/team/accept-invitation/${token}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setTeam(data.team);
                setInvitations([]);
                // Update user in session storage
                const updatedUser = JSON.parse(sessionStorage.getItem('user'));
                updatedUser.teamId = data.team._id;
                sessionStorage.setItem('user', JSON.stringify(updatedUser));

                toast.success(`Successfully joined ${teamName}!`);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to accept invitation');
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            toast.error('Failed to accept invitation');
        }
    };

    const handleTeamCreated = (newTeam) => {
        setTeam(newTeam);
        setShowCreateTeam(false);
    };

    const handleTeamUpdated = (updatedTeam) => {
        setTeam(updatedTeam);
        setShowEditTeam(false);
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm('Are you sure you want to leave this team?')) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/team/leave', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Successfully left the team');
                setTeam(null);
                // Update user in session storage
                const updatedUser = JSON.parse(sessionStorage.getItem('user'));
                updatedUser.teamId = null;
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to leave team');
            }
        } catch (error) {
            console.error('Error leaving team:', error);
            toast.error('Failed to leave team');
        }
    };

    // Check if current user is team owner
    const isTeamOwner = team && team.owner._id === user._id;
    return (
        <div className="min-h-screen bg-[#0d1117] relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 min-h-screen p-6">
                {/* Header */}
                <header className="max-w-7xl mx-auto mb-8">
                    <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center space-x-3">
                            <img
                                src={user.profilePicture}
                                alt="profile"
                                className="w-10 h-10 rounded-full border-2 border-[#3ecf8e]"
                            />
                            <div>
                                <p className="text-white font-medium text-sm">{user.username}</p>
                                <p className="text-[#8b949e] text-xs">{user.email}</p>
                            </div>

                            {/* Server Status Indicator */}
                            <button
                                onClick={() => setShowSystemInfo(true)}
                                className="flex items-center space-x-1.5 ml-4 px-2.5 py-1 bg-[#0d1117] border border-[#30363d] rounded-md hover:bg-[#30363d] transition-colors cursor-pointer"
                                title="Click to view system information"
                            >
                                <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-[#3ecf8e] animate-pulse' : 'bg-red-500'}`}></div>
                                <span className={`text-xs font-mono ${serverOnline ? 'text-[#3ecf8e]' : 'text-red-400'}`}>
                                    {serverOnline ? 'HomeLab Online' : 'HomeLab Offline'}
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Team Badge or Create Team Button */}
                            {loading ? (
                                <div className="text-[#8b949e] text-sm">Loading...</div>
                            ) : team ? (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-2 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-lg px-4 py-2">
                                        <Users className="w-4 h-4 text-[#3ecf8e]" />
                                        <span className="text-[#3ecf8e] font-medium text-sm">{team.name}</span>
                                        <span className="text-[#8b949e] text-xs">({team.members.length} members)</span>
                                    </div>

                                    {/* Edit button - only visible to team owner */}
                                    {isTeamOwner && (
                                        <button
                                            onClick={() => setShowEditTeam(true)}
                                            className="flex items-center space-x-1 bg-transparent border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58] text-[#8b949e] hover:text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-200"
                                            title="Edit Team (Owner Only)"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Leave Team button - only visible to members (not owner) */}
                                    {!isTeamOwner && (
                                        <button
                                            onClick={handleLeaveTeam}
                                            className="flex items-center space-x-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/30 text-orange-400 font-medium py-2 px-3 rounded-lg text-sm transition-all duration-200"
                                            title="Leave Team"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Leave</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCreateTeam(true)}
                                    className="flex items-center space-x-2 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-[#3ecf8e]/20"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create Team</span>
                                </button>
                            )}

                            {/* Deploy Button */}
                            <button
                                onClick={() => setShowDeployDialog(true)}
                                className="flex items-center space-x-2 bg-[#161b22] hover:bg-[#30363d] border border-[#30363d] hover:border-[#3ecf8e] text-white hover:text-[#3ecf8e] font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                            >
                                <Rocket className="w-4 h-4" />
                                <span>Deploy</span>
                            </button>

                            <button
                                onClick={onLogout}
                                className="flex items-center space-x-2 bg-transparent border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58] text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto space-y-6">
                    {/* Pending Invitations */}
                    {invitations.length > 0 && !team && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl backdrop-blur-xl">
                            <div className="flex items-center space-x-2 mb-4">
                                <Mail className="w-5 h-5 text-[#3ecf8e]" />
                                <h2 className="text-xl font-bold text-white">Pending Invitations</h2>
                            </div>
                            <div className="space-y-3">
                                {invitations.map((invitation) => (
                                    <div key={invitation.token} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={invitation.owner.profilePicture}
                                                alt={invitation.owner.username}
                                                className="w-10 h-10 rounded-full border border-[#30363d]"
                                            />
                                            <div>
                                                <p className="text-white font-medium">{invitation.teamName}</p>
                                                <p className="text-[#8b949e] text-xs">Invited by {invitation.owner.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAcceptInvitation(invitation.token, invitation.teamName)}
                                            className="flex items-center space-x-2 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Accept</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[#3ecf8e]/10 rounded-lg">
                                    <Rocket className="w-5 h-5 text-[#3ecf8e]" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Active Projects</h2>
                            </div>
                        </div>

                        {projectsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 h-48 animate-pulse"></div>
                                ))}
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <div key={project._id} className="group bg-[#161b22] border border-[#30363d] hover:border-[#3ecf8e]/50 rounded-xl p-6 shadow-xl transition-all duration-300 hover:scale-[1.02]">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-white group-hover:text-[#3ecf8e] transition-colors">{project.name}</h3>
                                                <p className="text-xs text-[#8b949e] font-mono whitespace-nowrap overflow-hidden text-overflow-ellipsis">{project.image}</p>
                                            </div>
                                            <div className="px-2 py-1 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded text-[10px] text-[#3ecf8e] font-bold uppercase tracking-wider">
                                                Running
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center text-sm text-[#8b949e]">
                                                <Server className="w-4 h-4 mr-2" />
                                                <span>Port: {project.port}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-[#8b949e]">
                                                <Globe className="w-4 h-4 mr-2" />
                                                <span className="truncate">{project.url.replace('https://', '')}</span>
                                            </div>
                                        </div>

                                        <a
                                            href={project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center space-x-2 py-2 bg-[#0d1117] hover:bg-[#3ecf8e] text-[#8b949e] hover:text-[#0d1117] border border-[#30363d] hover:border-[#3ecf8e] rounded-lg transition-all duration-200 text-sm font-medium"
                                        >
                                            <Globe className="w-4 h-4" />
                                            <span>Visit Project</span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#161b22] border border-[#30363d] border-dashed rounded-xl p-12 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 bg-[#30363d] rounded-full">
                                        <Rocket className="w-8 h-8 text-[#8b949e]" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                                <p className="text-[#8b949e] max-w-sm mx-auto mb-6">
                                    Launch your first containerized application to see it here.
                                </p>
                                <button
                                    onClick={() => setShowDeployDialog(true)}
                                    className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-medium py-2 px-6 rounded-lg transition-all"
                                >
                                    Deploy Now
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Team Modal */}
            {showCreateTeam && (
                <CreateTeam
                    onClose={() => setShowCreateTeam(false)}
                    onTeamCreated={handleTeamCreated}
                />
            )}

            {/* Edit Team Modal */}
            {showEditTeam && (
                <EditTeam
                    team={team}
                    onClose={() => setShowEditTeam(false)}
                    onTeamUpdated={handleTeamUpdated}
                />
            )}

            {/* System Info Dialog */}
            <SystemInfoDialog
                isOpen={showSystemInfo}
                onClose={() => setShowSystemInfo(false)}
                systemData={systemData}
            />

            {/* Deploy Dialog */}
            <DeployDialog
                isOpen={showDeployDialog}
                onClose={() => setShowDeployDialog(false)}
                teamId={team?._id}
                onSuccess={fetchProjects}
            />
        </div>
    );
};

export default Dashboard;
