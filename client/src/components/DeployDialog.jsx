import React, { useState, useEffect } from 'react';
import { X, Rocket, Terminal, CheckCircle2, Globe, Server, Hash, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const DeployDialog = ({ isOpen, onClose, teamId, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        port: 80,
        domain: 'mohandev.me',
        subdomain: ''
    });
    const [status, setStatus] = useState('idle'); // idle, deploying, success, error
    const [logs, setLogs] = useState([]);
    const [result, setResult] = useState(null);

    if (!isOpen) return null;


    const handleDeploy = async (e) => {
        e.preventDefault();
        setStatus('deploying');
        setLogs([]);

        try {
            const res = await fetch('https://agent.mohandev.me/deploy', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer lathilathi',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: 'Deployment failed' }));
                throw new Error(errorData.message || 'Deployment failed');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // Process lines for logs, excluding potential JSON parts
                const lines = accumulatedText.split('\n');
                const displayLines = lines.filter(line => {
                    const trimmed = line.trim();
                    return trimmed !== '' && !trimmed.startsWith('{');
                });
                setLogs(displayLines);
            }

            // After stream completes, look for the JSON result
            const lines = accumulatedText.split('\n');
            const jsonString = lines.find(line => line.trim().startsWith('{'));

            if (jsonString) {
                try {
                    const data = JSON.parse(jsonString);
                    setResult(data);

                    // Record the project in our backend
                    try {
                        const token = sessionStorage.getItem('token');
                        await fetch(`${import.meta.env.VITE_API_URL}/api/project/record`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                name: formData.name,
                                image: formData.image,
                                port: formData.port,
                                url: data.url,
                                teamId: teamId
                            })
                        });
                    } catch (recordError) {
                        console.error('Failed to record project in backend:', recordError);
                    }

                    setStatus('success');
                    if (onSuccess) onSuccess();
                    toast.success('Application deployed successfully!');
                } catch (e) {
                    console.error('Failed to parse final result:', e);
                    setStatus('error');
                    toast.error('Deployment finished but failed to parse response');
                }
            } else {
                // If it finished but no JSON was found (maybe it was just logs and an error at the end?)
                if (accumulatedText.toLowerCase().includes('success')) {
                    setStatus('success');
                    toast.success('Deployment complete!');
                } else {
                    setStatus('error');
                    toast.error('Deployment finished unexpectedly');
                }
            }
        } catch (error) {
            console.error('Deployment error:', error);
            setStatus('error');
            toast.error(error.message || 'Failed to deploy application');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-2xl shadow-2xl transition-all duration-300 ${status === 'deploying' ? 'scale-105' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#3ecf8e]/10 rounded-lg">
                            <Rocket className="w-6 h-6 text-[#3ecf8e]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Deploy New Application</h2>
                            <p className="text-[#8b949e] text-sm">Launch your containerized app</p>
                        </div>
                    </div>
                    {status !== 'deploying' && (
                        <button onClick={onClose} className="p-2 hover:bg-[#30363d] rounded-lg transition-colors">
                            <X className="w-5 h-5 text-[#8b949e] hover:text-white" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {status === 'idle' ? (
                        <form onSubmit={handleDeploy} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#8b949e] flex items-center gap-2">
                                        <Hash className="w-4 h-4" /> App Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3ecf8e] outline-none"
                                        placeholder="my-app69"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#8b949e] flex items-center gap-2">
                                        <Monitor className="w-4 h-4" /> Docker Image
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3ecf8e] outline-none"
                                        placeholder="nginx:latest"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#8b949e] flex items-center gap-2">
                                        <Server className="w-4 h-4" /> Container Port
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3ecf8e] outline-none"
                                        placeholder="80"
                                        value={formData.port}
                                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#8b949e] flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Subdomain
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            required
                                            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3ecf8e] outline-none"
                                            placeholder="myapp69"
                                            value={formData.subdomain}
                                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                                        />
                                        <span className="text-[#8b949e] font-mono">.mohandev.me</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full mt-4 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#3ecf8e]/20"
                            >
                                <Rocket className="w-5 h-5" /> Deploy Application
                            </button>
                        </form>
                    ) : status === 'deploying' ? (
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6 font-mono text-sm space-y-2 min-h-[300px]">
                            <div className="flex items-center gap-2 text-[#3ecf8e] mb-4">
                                <Terminal className="w-4 h-4" />
                                <span>Deployment Logs</span>
                            </div>
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-[#8b949e] opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="text-white">{log}</span>
                                    {i === logs.length - 1 && <span className="w-2 h-4 bg-[#3ecf8e] animate-pulse"></span>}
                                </div>
                            ))}
                        </div>
                    ) : status === 'success' ? (
                        <div className="text-center py-8 space-y-6">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <CheckCircle2 className="w-24 h-24 text-[#3ecf8e] animate-bounce" />
                                    <div className="absolute inset-0 bg-[#3ecf8e]/20 blur-2xl rounded-full"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">Application Live!</h3>
                                <p className="text-[#8b949e]">Your application has been successfully deployed and is now accessible.</p>
                            </div>
                            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-xs text-[#8b949e] uppercase font-bold tracking-wider">Public URL</p>
                                    <p className="text-[#3ecf8e] font-mono">{result?.url}</p>
                                </div>
                                <a
                                    href={result?.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Visit App
                                </a>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full bg-[#30363d] hover:bg-[#3ecf8e] hover:text-[#0d1117] text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-red-500 text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-white">Deployment Failed</h3>
                            <button
                                onClick={() => setStatus('idle')}
                                className="bg-[#30363d] hover:bg-white hover:text-[#0d1117] text-white px-6 py-2 rounded-lg transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeployDialog;
