import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔐 Admin login attempt...');
      const response = await axios.post(`${API}/api/login`, loginForm, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const { access_token, user: userData } = response.data;
      
      // Store authentication data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Admin login successful:', userData);
      
      // Redirect based on role
      if (userData.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        // For regular managers, show message about needing location context
        alert('Login successful! Please access the system through your specific location page.');
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      alert('Invalid credentials. Please check your username and password.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header with FLEXSPAS image */}
      <header className="bg-black">
        <div className="w-full">
          <Link to="/">
            <img 
              src="https://customer-assets.emergentagent.com/job_spatracker-1/artifacts/d6xck9vw_IMG_3413.jpeg"
              alt="FLEXSPAS Header"
              className="w-full h-auto max-h-32 object-contain cursor-pointer"
            />
          </Link>
        </div>
        <div className="bg-black py-6 text-center border-t border-gray-800">
          <h2 className="text-white text-3xl font-black mb-2 tracking-widest" style={{
            fontFamily: 'Impact, "Franklin Gothic Bold", "Arial Black", sans-serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.15em'
          }}>
            ADMINISTRATOR LOGIN
          </h2>
          <p className="text-gray-300 text-base font-medium tracking-wide">Super Admin & Management Portal</p>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto bg-gray-900 border border-red-500 rounded-lg p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-3 tracking-wider" style={{
              fontFamily: 'Impact, "Franklin Gothic Bold", "Arial Black", sans-serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.1em'
            }}>
              ADMIN PORTAL
            </h2>
            <p className="text-gray-300 text-lg font-medium">Secure administrator access</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
                className="w-full bg-black border-2 border-gray-600 text-white placeholder:text-gray-400 focus:border-red-500 px-4 py-3 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                style={{
                  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                  letterSpacing: '0.02em'
                }}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
                className="w-full bg-black border-2 border-gray-600 text-white placeholder:text-gray-400 focus:border-red-500 px-4 py-3 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                style={{
                  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                  letterSpacing: '0.02em'
                }}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: 'Impact, "Franklin Gothic Bold", "Arial Black", sans-serif',
                fontSize: '1.25rem',
                fontWeight: '900',
                letterSpacing: '0.1em',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {loading ? 'SIGNING IN...' : 'ADMIN SIGN IN'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-red-500 hover:text-red-400 text-sm">
              ← Back to Main Site
            </Link>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-600 text-center">
            <p className="text-xs text-gray-400">
              Secure administrator access only. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;