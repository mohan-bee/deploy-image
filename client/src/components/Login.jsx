import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { CheckCircle2 } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await res.json();
      const { user, token } = data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      // Notify parent component of successful login
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setProfile(null);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error('Fetch Profile Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] relative overflow-hidden">
      {/* Supabase-style gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {user ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profile Card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 shadow-2xl backdrop-blur-xl">
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                    <p className="text-[#8b949e] text-sm">Your authenticated session</p>
                  </div>

                  <div className="flex flex-col items-center space-y-4 py-6">
                    <div className="relative">
                      <img
                        src={user.profilePicture}
                        alt="profile"
                        className="w-20 h-20 rounded-full border-2 border-[#3ecf8e] shadow-xl"
                      />
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#3ecf8e] rounded-full border-2 border-[#161b22]"></div>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                      <p className="text-[#8b949e] text-sm">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={fetchProfile}
                      disabled={loading}
                      className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#0d1117] font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3ecf8e]/20"
                    >
                      {loading ? 'Loading...' : 'View Profile'}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="bg-transparent border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58] text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {profile && (
                  <div className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-[#8b949e] uppercase tracking-wider">Response</span>
                      <button
                        onClick={() => setProfile(null)}
                        className="text-xs text-[#3ecf8e] hover:underline font-medium"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-[#30363d] overflow-auto max-h-64">
                      <pre className="text-[10px] font-mono text-[#3ecf8e]">
                        {JSON.stringify(profile, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Hero Section */}
              <div className="text-center space-y-4">
                <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                  Build in a{' '}
                  <span className="bg-gradient-to-r from-[#3ecf8e] to-[#38b578] bg-clip-text text-transparent">
                    weekend
                  </span>
                </h1>
                <p className="text-[#8b949e] text-lg sm:text-xl font-light">
                  Scale to millions with secure authentication
                </p>
              </div>

              {/* Login Card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 shadow-2xl backdrop-blur-xl">
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-full max-w-[280px] h-auto [&>div]:w-full [&>div]:max-w-full [&_iframe]:max-w-full">
                      <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_blue"
                        size="medium"
                        text="continue_with"
                        shape="pill"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#30363d]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#161b22] px-4 text-[#8b949e] font-medium tracking-widest">
                        Secure Authentication
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-xs text-[#8b949e]">
                    <CheckCircle2 className="w-3 h-3 text-[#3ecf8e]" />
                    <span className="font-mono">Port 9000 • OAuth 2.0</span>
                  </div>
                </div>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {['Fast Setup', 'Production Ready', 'Secure by Default'].map((feature) => (
                  <div
                    key={feature}
                    className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-[#8b949e] font-medium"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#484f58] font-mono">
              Built with Supabase-inspired design
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;