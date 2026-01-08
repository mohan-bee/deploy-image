import React from 'react';
import { X, Server, Cpu, HardDrive, Network, Activity, Clock, Monitor, Database } from 'lucide-react';

const SystemInfoDialog = ({ isOpen, onClose, systemData }) => {
    if (!isOpen) return null;

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const formatPercent = (value) => {
        return `${value.toFixed(2)}%`;
    };

    if (!systemData) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 max-w-4xl w-full shadow-2xl">
                    <div className="flex items-center justify-center">
                        <div className="text-[#8b949e] text-lg">Loading system information...</div>
                    </div>
                </div>
            </div>
        );
    }

    const { host, cpu, memory, disk, network, processes } = systemData;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-6xl w-full shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#3ecf8e]/10 rounded-lg">
                            <Server className="w-6 h-6 text-[#3ecf8e]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">HomeLab Information</h2>
                            <p className="text-[#8b949e] text-sm">Real-time HomeLab metrics</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#30363d] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[#8b949e] hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Host Information */}
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                        <div className="flex items-center space-x-2 mb-4">
                            <Monitor className="w-5 h-5 text-[#3ecf8e]" />
                            <h3 className="text-lg font-semibold text-white">Host Information</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoItem label="Hostname" value={host.hostname} />
                            <InfoItem label="OS" value={`${host.os} (${host.platform})`} />
                            <InfoItem label="Platform Version" value={host.platformVersion} />
                            <InfoItem label="Kernel" value={`${host.kernelVersion} (${host.kernelArch})`} />
                            <InfoItem label="Uptime" value={formatUptime(host.uptime)} />
                            <InfoItem label="Processes" value={host.procs} />
                            <InfoItem label="Virtualization" value={`${host.virtualizationSystem} (${host.virtualizationRole})`} />
                        </div>
                    </div>

                    {/* CPU Information */}
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                        <div className="flex items-center space-x-2 mb-4">
                            <Cpu className="w-5 h-5 text-[#3ecf8e]" />
                            <h3 className="text-lg font-semibold text-white">CPU Information</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[#8b949e] text-sm mb-2">Model</p>
                                <p className="text-white font-mono text-sm">{cpu.info[0].modelName}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InfoItem label="Cores" value={cpu.info.length} />
                                <InfoItem label="Frequency" value={`${cpu.info[0].mhz} MHz`} />
                                <InfoItem label="Cache Size" value={`${cpu.info[0].cacheSize} KB`} />
                                <InfoItem label="Vendor" value={cpu.info[0].vendorId} />
                            </div>
                            <div>
                                <p className="text-[#8b949e] text-sm mb-3">CPU Usage per Core</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {cpu.usage.map((usage, index) => (
                                        <div key={index} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[#8b949e] text-xs font-mono">Core {index}</span>
                                                <span className="text-white text-xs font-mono">{formatPercent(usage)}</span>
                                            </div>
                                            <div className="w-full bg-[#30363d] rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-[#3ecf8e] to-emerald-400 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(usage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memory Information */}
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                        <div className="flex items-center space-x-2 mb-4">
                            <Database className="w-5 h-5 text-[#3ecf8e]" />
                            <h3 className="text-lg font-semibold text-white">Memory Information</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InfoItem label="Total" value={formatBytes(memory.total)} />
                                <InfoItem label="Used" value={formatBytes(memory.used)} />
                                <InfoItem label="Free" value={formatBytes(memory.free)} />
                                <InfoItem label="Available" value={formatBytes(memory.available)} />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[#8b949e] text-sm">Memory Usage</span>
                                    <span className="text-white font-mono text-sm">{formatPercent(memory.usedPercent)}</span>
                                </div>
                                <div className="w-full bg-[#30363d] rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#3ecf8e] to-emerald-400 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(memory.usedPercent, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                <InfoItem label="Active" value={formatBytes(memory.active)} />
                                <InfoItem label="Inactive" value={formatBytes(memory.inactive)} />
                                <InfoItem label="Cached" value={formatBytes(memory.cached)} />
                                <InfoItem label="Buffers" value={formatBytes(memory.buffers)} />
                            </div>
                        </div>
                    </div>

                    {/* Disk Storage Information */}
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                        <div className="flex items-center space-x-2 mb-4">
                            <HardDrive className="w-5 h-5 text-[#3ecf8e]" />
                            <h3 className="text-lg font-semibold text-white">Disk Storage</h3>
                        </div>
                        {disk && disk.total ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium text-sm">{disk.mount || '/'}</p>
                                        {disk.fstype && <p className="text-[#8b949e] text-xs">{disk.fstype}</p>}
                                    </div>
                                    <span className="text-white font-mono text-sm">{formatPercent(disk.used_percent)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <InfoItem label="Total" value={formatBytes(disk.total)} />
                                    <InfoItem label="Used" value={formatBytes(disk.used)} />
                                    <InfoItem label="Free" value={formatBytes(disk.free)} />
                                </div>
                                <div className="w-full bg-[#30363d] rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#3ecf8e] to-emerald-400 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(disk.used_percent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[#8b949e] text-sm">Disk usage statistics not available</p>
                                <p className="text-[#6e7681] text-xs mt-2">The API does not provide disk usage information</p>
                            </div>
                        )}
                    </div>

                    {/* Network Statistics */}
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                        <div className="flex items-center space-x-2 mb-4">
                            <Network className="w-5 h-5 text-[#3ecf8e]" />
                            <h3 className="text-lg font-semibold text-white">Network Statistics</h3>
                        </div>
                        {network ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoItem label="Total RX" value={formatBytes(network.rx_bytes)} />
                                    <InfoItem label="Total TX" value={formatBytes(network.tx_bytes)} />
                                    <InfoItem label="RX Rate" value={`${formatBytes(network.rx_bytes_per_sec)}/s`} />
                                    <InfoItem label="TX Rate" value={`${formatBytes(network.tx_bytes_per_sec)}/s`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[#8b949e] text-xs">Download</span>
                                            <span className="text-[#3ecf8e] text-xs font-mono">↓ {formatBytes(network.rx_bytes_per_sec)}/s</span>
                                        </div>
                                        <p className="text-white font-mono text-lg">{formatBytes(network.rx_bytes)}</p>
                                        <p className="text-[#8b949e] text-xs mt-1">Total Received</p>
                                    </div>
                                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[#8b949e] text-xs">Upload</span>
                                            <span className="text-emerald-400 text-xs font-mono">↑ {formatBytes(network.tx_bytes_per_sec)}/s</span>
                                        </div>
                                        <p className="text-white font-mono text-lg">{formatBytes(network.tx_bytes)}</p>
                                        <p className="text-[#8b949e] text-xs mt-1">Total Transmitted</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[#8b949e] text-sm">Network statistics not available</p>
                            </div>
                        )}
                    </div>

                    {/* Process Information */}
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                        <div className="flex items-center space-x-2 mb-4">
                            <Activity className="w-5 h-5 text-[#3ecf8e]" />
                            <h3 className="text-lg font-semibold text-white">Running Processes</h3>
                        </div>
                        <div className="space-y-3">
                            {processes.map((process, index) => (
                                <div key={index} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <InfoItem label="Name" value={process.name} />
                                        <InfoItem label="PID" value={process.pid} />
                                        <InfoItem label="CPU %" value={formatPercent(process.cpu_percent)} />
                                        <InfoItem label="Memory %" value={formatPercent(process.mem_percent)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center justify-center space-x-2 text-[#8b949e] text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: {new Date(systemData.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for displaying info items
const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-[#8b949e] text-xs mb-1">{label}</p>
        <p className="text-white font-mono text-sm break-all">{value}</p>
    </div>
);

export default SystemInfoDialog;
