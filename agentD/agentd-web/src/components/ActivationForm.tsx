import React, { useState } from 'react';

export default function ActivationForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/validate-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.valid) {
        localStorage.setItem('activation', JSON.stringify({ email, code }));
        onSuccess();
      } else {
        setError(data.message || 'Invalid activation code.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-0f1923 via-1a2942 to-132847 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <form onSubmit={handleSubmit} className="relative z-10 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-lg p-8 max-w-md w-full border border-white/20">
        <h2 className="text-2xl font-bold mb-2 text-white">Activate AgentD</h2>
        <p className="text-sm text-white/60 mb-6 font-medium">Enter your activation details to get started</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase mb-2 tracking-wide pixelated">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-white/20 rounded-2xl bg-white/12 backdrop-blur-sm text-white placeholder-white/40 font-medium focus:outline-none focus:border-indigo-400/60 focus:bg-white/15 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase mb-2 tracking-wide pixelated">Activation Code</label>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 border border-white/20 rounded-2xl bg-white/12 backdrop-blur-sm text-white placeholder-white/40 font-medium focus:outline-none focus:border-indigo-400/60 focus:bg-white/15 transition-all"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg text-red-200 text-sm font-medium">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full mt-6 py-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-medium text-sm uppercase tracking-wide hover:bg-white/25 hover:border-white/30 transition-all shadow-lg"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Activate'}
        </button>
        
        <div className="mt-4 text-center text-white/60 text-xs font-medium">
          Don&apos;t have a code?{' '}
          <a href="https://your-official-website.com" className="text-indigo-400 hover:text-indigo-300 transition" target="_blank" rel="noopener noreferrer">
            Create one here
          </a>
        </div>
      </form>
    </div>
  );
} 