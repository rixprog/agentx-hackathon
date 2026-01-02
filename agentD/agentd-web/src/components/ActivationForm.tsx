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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-faf2de via-fef9f0 to-f5ead4 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <form onSubmit={handleSubmit} className="relative z-10 bg-white/20 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/30">
        <h2 className="text-3xl font-anton mb-2 text-2e2e2e uppercase tracking-wider">Activate AgentD</h2>
        <p className="text-sm text-gray-600 mb-6 font-general-sans">Enter your activation details to get started</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bebas text-2e2e2e uppercase mb-2 tracking-wide">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-white/40 rounded-lg bg-white/30 backdrop-blur-sm text-2e2e2e font-general-sans focus:outline-none focus:border-5f5ce5/60 focus:bg-white/40 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bebas text-2e2e2e uppercase mb-2 tracking-wide">Activation Code</label>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 border border-white/40 rounded-lg bg-white/30 backdrop-blur-sm text-2e2e2e font-mono focus:outline-none focus:border-5f5ce5/60 focus:bg-white/40 transition-all"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg text-red-600 text-sm font-general-sans">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full mt-6 py-3 bg-white/25 backdrop-blur-sm border border-white/40 rounded-lg text-2e2e2e font-bebas text-sm uppercase tracking-widest hover:bg-white/35 hover:border-5f5ce5/60 transition-all shadow-lg"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Activate'}
        </button>
        
        <div className="mt-4 text-center text-gray-700 text-xs font-general-sans">
          Don&apos;t have a code?{' '}
          <a href="https://your-official-website.com" className="text-5f5ce5 underline hover:text-ffd9800 transition" target="_blank" rel="noopener noreferrer">
            Create one here
          </a>
        </div>
      </form>
    </div>
  );
} 