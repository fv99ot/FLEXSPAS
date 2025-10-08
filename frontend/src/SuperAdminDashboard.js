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
        // Show demo data for non-super-admin users
        const demoAnalytics = {
          report_generated: new Date().toISOString(),
          report_period: "Last 30 Days (Demo Mode)",
          total_checkins: 1247,
          total_revenue: 37420,
          avg_stay_duration: 2.3,
          total_locations: 4,
          location_performance: [
            {
              location_id: 'los-angeles',
              location_name: 'Los Angeles',
              active_customers: 150,
              total_checkins: 425,
              total_revenue: 12450,
              avg_stay_duration: 2.1,
              peak_hour: '2:00 PM - 3:00 PM',
              occupancy_rate: 78
            },
            {
              location_id: 'atlanta',
              location_name: 'Atlanta',
              active_customers: 120,
              total_checkins: 298,
              total_revenue: 8930,
              avg_stay_duration: 2.4,
              peak_hour: '1:00 PM - 2:00 PM',
              occupancy_rate: 65
            },
            {
              location_id: 'cleveland',
              location_name: 'Cleveland',
              active_customers: 95,
              total_checkins: 225,
              total_revenue: 6750,
              avg_stay_duration: 2.6,
              peak_hour: '3:00 PM - 4:00 PM',
              occupancy_rate: 58
            },
            {
              location_id: 'phoenix',
              location_name: 'Phoenix',
              active_customers: 110,
              total_checkins: 299,
              total_revenue: 9200,
              avg_stay_duration: 2.2,
              peak_hour: '12:00 PM - 1:00 PM',
              occupancy_rate: 72
            }
          ],
          peak_times: [
            { hour: 9, hour_label: '9:00 AM', checkin_count: 15 },
            { hour: 10, hour_label: '10:00 AM', checkin_count: 28 },
            { hour: 11, hour_label: '11:00 AM', checkin_count: 42 },
            { hour: 12, hour_label: '12:00 PM', checkin_count: 65 },
            { hour: 13, hour_label: '1:00 PM', checkin_count: 78 },
            { hour: 14, hour_label: '2:00 PM', checkin_count: 85 },
            { hour: 15, hour_label: '3:00 PM', checkin_count: 72 },
            { hour: 16, hour_label: '4:00 PM', checkin_count: 58 },
            { hour: 17, hour_label: '5:00 PM', checkin_count: 45 },
            { hour: 18, hour_label: '6:00 PM', checkin_count: 32 }
          ],
          visitor_demographics: {
            age_groups: {
              '18-25': 145,
              '26-35': 298,
              '36-45': 425,
              '46-55': 267,
              '56+': 112
            },
            repeat_customers: 892,
            new_customers: 355,
            membership_types: {
              'premium': 234,
              'standard': 567,
              'basic': 298,
              'day_pass': 148
            }
          },
          growth_metrics: {
            revenue_growth: 12.5,
            customer_growth: 8.3,
            checkin_growth: 15.2
          },
          top_performing_location: 'Los Angeles'
        };
        
        setGlobalAnalytics(demoAnalytics);
        setShowGlobalReport(true);
        console.log('📊 Demo analytics loaded for non-super-admin user');
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
                <button 
                  onClick={handleAddLocation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
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

      {/* Global Analytics Report Modal */}
      {showGlobalReport && globalAnalytics && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Global Analytics Report</h3>
                  <p className="text-sm text-gray-500">
                    Generated: {new Date(globalAnalytics.report_generated).toLocaleDateString()} | 
                    Period: {globalAnalytics.report_period}
                  </p>
                </div>
                <button
                  onClick={() => setShowGlobalReport(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Key Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{globalAnalytics.total_checkins.toLocaleString()}</div>
                  <div className="text-sm text-blue-800">Total Check-ins</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(globalAnalytics.total_revenue)}</div>
                  <div className="text-sm text-green-800">Total Revenue</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatDuration(globalAnalytics.avg_stay_duration)}</div>
                  <div className="text-sm text-purple-800">Avg Stay Duration</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{globalAnalytics.total_locations}</div>
                  <div className="text-sm text-yellow-800">Active Locations</div>
                </div>
              </div>

              {/* Location Performance Comparison */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Location Performance Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-ins</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Stay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {globalAnalytics.location_performance.map((location, index) => (
                        <tr key={location.location_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{location.location_name}</div>
                            <div className="text-sm text-gray-500">{location.active_customers} active customers</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {location.total_checkins.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(location.total_revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDuration(location.avg_stay_duration)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {location.peak_hour}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {location.occupancy_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Peak Times Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Peak Times Analysis</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      {globalAnalytics.peak_times
                        .filter(time => time.checkin_count > 0)
                        .sort((a, b) => b.checkin_count - a.checkin_count)
                        .slice(0, 6)
                        .map((time, index) => (
                          <div key={time.hour} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{time.hour_label}</span>
                            <div className="flex items-center">
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{
                                    width: `${(time.checkin_count / Math.max(...globalAnalytics.peak_times.map(t => t.checkin_count))) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{time.checkin_count}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* Visitor Demographics */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Visitor Demographics</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    
                    {/* Age Groups */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Age Groups</h5>
                      {Object.entries(globalAnalytics.visitor_demographics.age_groups).map(([age, count]) => (
                        <div key={age} className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{age}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>

                    {/* Customer Type */}
                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Customer Engagement</h5>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Repeat Customers</span>
                        <span className="text-sm font-medium text-green-600">{globalAnalytics.visitor_demographics.repeat_customers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">New Customers</span>
                        <span className="text-sm font-medium text-blue-600">{globalAnalytics.visitor_demographics.new_customers}</span>
                      </div>
                    </div>

                    {/* Membership Types */}
                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Popular Memberships</h5>
                      {Object.entries(globalAnalytics.visitor_demographics.membership_types)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Metrics & Top Performer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h4>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                        <span className="text-sm font-bold text-green-600">+{globalAnalytics.growth_metrics.revenue_growth}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Customer Growth</span>
                        <span className="text-sm font-bold text-blue-600">+{globalAnalytics.growth_metrics.customer_growth}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Check-in Growth</span>
                        <span className="text-sm font-bold text-purple-600">+{globalAnalytics.growth_metrics.checkin_growth}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Location</h4>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2">🏆</div>
                      <div className="text-xl font-bold text-gray-900">{globalAnalytics.top_performing_location}</div>
                      <div className="text-sm text-gray-600 mt-2">Highest revenue performance this period</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGlobalReport(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Global Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">System Configuration</h4>
                  <p className="text-sm text-gray-600 mb-3">Manage global system settings and policies</p>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
                      Business Hours Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
                      Pricing Configuration
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
                      Email Templates
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
                      User Permissions
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Location</h3>
                <button
                  onClick={() => setShowAddLocation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Miami" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Full address including city, state, zip"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="(555) 123-FLEX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="manager@flexspas.com" />
                </div>
              </form>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddLocation(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Location setup functionality would be implemented here');
                    setShowAddLocation(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;