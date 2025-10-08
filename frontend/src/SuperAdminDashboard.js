import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SuperAdminDashboard = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showGlobalReport, setShowGlobalReport] = useState(false);
  const [globalAnalytics, setGlobalAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  
  // Get API URL from environment
  const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  
  const locations = [
    {
      id: 'los-angeles',
      name: 'Los Angeles',
      address: '123 Spa Street, Los Angeles, CA 90210',
      phone: '(555) 123-FLEX',
      status: 'Active',
      customers: 150,
      activeCheckins: 8,
      revenue: '$12,450'
    },
    {
      id: 'atlanta', 
      name: 'Atlanta',
      address: '456 Wellness Ave, Atlanta, GA 30309',
      phone: '(555) 456-FLEX',
      status: 'Active',
      customers: 120,
      activeCheckins: 5,
      revenue: '$8,930'
    },
    {
      id: 'cleveland',
      name: 'Cleveland',
      address: '789 Relaxation Blvd, Cleveland, OH 44115', 
      phone: '(555) 789-FLEX',
      status: 'Active',
      customers: 95,
      activeCheckins: 3,
      revenue: '$6,750'
    },
    {
      id: 'phoenix',
      name: 'Phoenix',
      address: '321 Desert Spa Dr, Phoenix, AZ 85001',
      phone: '(555) 321-FLEX',
      status: 'Active',
      customers: 110,
      activeCheckins: 6,
      revenue: '$9,200'
    }
  ];

  // Generate Global Analytics Report
  const generateGlobalReport = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again to continue.');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(`${API}/api/analytics/global?days=30`, { headers });
      setGlobalAnalytics(response.data);
      setShowGlobalReport(true);
      console.log('✅ Global analytics loaded:', response.data);
    } catch (error) {
      console.error('Analytics error:', error);
      if (error.response?.status === 403) {
        alert('Super admin privileges required to view global analytics.');
      } else {
        alert('Failed to load analytics. Please try again.');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handle Global Settings
  const handleGlobalSettings = () => {
    setShowSettings(true);
  };

  // Handle Add Location
  const handleAddLocation = () => {
    setShowAddLocation(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format duration
  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              {/* FLEXSPAS Logo */}
              <Link to="/" className="text-white">
                <h1 className="text-4xl font-black tracking-tight" style={{
                  textShadow: '2px 2px 0px rgba(255,255,255,0.1)',
                  fontFamily: 'Arial Black, sans-serif'
                }}>
                  FLEXSPAS<span className="text-xs align-super">®</span>
                </h1>
              </Link>
              
              {/* Website URL */}
              <div className="text-red-500 font-bold text-lg tracking-wide">
                FLEXSPAS.COM
              </div>
            </div>
            
            <div className="flex items-center">
              <Link
                to="/"
                className="text-red-500 hover:text-red-400 px-3 py-2 font-bold text-sm tracking-wide"
              >
                BACK TO MAIN SITE
              </Link>
            </div>
          </div>
          
          {/* Location Cities Row */}
          <div className="border-t border-gray-800 py-2">
            <div className="flex justify-center space-x-8 text-red-500 font-bold text-sm tracking-widest">
              <span>ATLANTA</span>
              <span>CLEVELAND</span>
              <span>LOS ANGELES</span>
              <span>PHOENIX</span>
            </div>
          </div>
          
          {/* Super Admin Title */}
          <div className="py-2 text-center border-t border-gray-800">
            <h2 className="text-white text-xl font-bold">SUPER ADMIN DASHBOARD</h2>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Locations</dt>
                    <dd className="text-lg font-medium text-gray-900">{locations.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {locations.reduce((sum, loc) => sum + loc.customers, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Check-ins</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {locations.reduce((sum, loc) => sum + loc.activeCheckins, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${locations.reduce((sum, loc) => sum + parseInt(loc.revenue.replace(/[$,]/g, '')), 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Management */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Location Management</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage all FLEX Spa locations from this central dashboard.
            </p>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {locations.map((location) => (
              <li key={location.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                        <div className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${location.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {location.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{location.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{location.customers}</div>
                      <div>Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{location.activeCheckins}</div>
                      <div>Active</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{location.revenue}</div>
                      <div>Revenue</div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/${location.id}/admin`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Manage
                      </Link>
                      <button
                        onClick={() => setSelectedLocation(location)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Global Reports</h3>
                  <p className="text-sm text-gray-500">View comprehensive analytics across all locations</p>
                </div>
              </div>
              <div className="mt-4">
                <button 
                  onClick={generateGlobalReport}
                  disabled={analyticsLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {analyticsLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Global Settings</h3>
                  <p className="text-sm text-gray-500">Configure system-wide preferences and policies</p>
                </div>
              </div>
              <div className="mt-4">
                <button 
                  onClick={handleGlobalSettings}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Manage Settings
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Add Location</h3>
                  <p className="text-sm text-gray-500">Set up a new FLEX Spa location</p>
                </div>
              </div>
              <div className="mt-4">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md">
                  Add New Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedLocation.name} Details</h3>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm text-gray-900">{selectedLocation.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{selectedLocation.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">{selectedLocation.status}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedLocation.customers}</div>
                    <div className="text-sm text-gray-500">Total Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedLocation.activeCheckins}</div>
                    <div className="text-sm text-gray-500">Active Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedLocation.revenue}</div>
                    <div className="text-sm text-gray-500">Today's Revenue</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <Link
                  to={`/${selectedLocation.id}/admin`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Manage Location
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;