import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Import the existing App component functionality
// For now, I'll create a wrapper that passes location context
const LocationApp = () => {
  // Extract location from the current path
  const location = window.location.pathname.split('/')[1];
  const [locationInfo, setLocationInfo] = useState(null);
  
  const locations = {
    'los-angeles': {
      name: 'Los Angeles',
      address: '123 Spa Street, Los Angeles, CA 90210',
      phone: '(555) 123-FLEX',
      dbName: 'flexspa_losangeles'
    },
    'atlanta': {
      name: 'Atlanta',
      address: '456 Wellness Ave, Atlanta, GA 30309', 
      phone: '(555) 456-FLEX',
      dbName: 'flexspa_atlanta'
    },
    'cleveland': {
      name: 'Cleveland',
      address: '789 Relaxation Blvd, Cleveland, OH 44115',
      phone: '(555) 789-FLEX', 
      dbName: 'flexspa_cleveland'
    },
    'phoenix': {
      name: 'Phoenix',
      address: '321 Desert Spa Dr, Phoenix, AZ 85001',
      phone: '(555) 321-FLEX',
      dbName: 'flexspa_phoenix'
    }
  };

  useEffect(() => {
    if (location && locations[location]) {
      setLocationInfo(locations[location]);
      // Store location context for API calls
      localStorage.setItem('currentLocation', location);
      localStorage.setItem('currentDbName', locations[location].dbName);
    }
  }, [location]);

  if (!locationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Location not found</h2>
          <Link 
            to="/" 
            className="text-indigo-600 hover:text-indigo-500"
          >
            Return to main site
          </Link>
        </div>
      </div>
    );
  }

  // For now, show a placeholder that will be replaced with the actual app
  return (
    <div className="min-h-screen bg-black">
      {/* Location Header */}
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
        {/* Navigation row */}
        <div className="bg-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex justify-end space-x-4">
            <Link
              to="/super-admin"
              className="text-red-500 hover:text-red-400 px-3 py-2 font-bold text-sm tracking-wide"
            >
              SUPER ADMIN
            </Link>
            <Link
              to="/"
              className="text-red-500 hover:text-red-400 px-3 py-2 font-bold text-sm tracking-wide"
            >
              MAIN SITE
            </Link>
          </div>
        </div>
        {/* Location Specific Info */}
        <div className="bg-black py-2 text-center border-t border-gray-800">
          <h2 className="text-white text-xl font-bold">{locationInfo?.name.toUpperCase()}</h2>
          <p className="text-gray-300 text-sm">{locationInfo?.address}</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to FLEX Spa {locationInfo.name}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Location-specific admin portal coming soon. This will contain the full spa management system.
              </p>
              
              {/* Placeholder buttons for main app features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Management</h3>
                  <p className="text-gray-600">Manage customer registrations, check-ins, and profiles</p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Room Management</h3>
                  <p className="text-gray-600">Monitor room availability and customer assignments</p>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
                  <p className="text-gray-600">View sales reports and business analytics</p>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => {
                    // This will be replaced with the actual app login
                    alert(`This will redirect to the full admin system for ${locationInfo.name}.\n\nDatabase: ${locationInfo.dbName}\nPhone: ${locationInfo.phone}`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-md text-lg"
                >
                  Access Admin System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{locationInfo.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{locationInfo.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Database</label>
                <p className="mt-1 text-sm text-gray-900">{locationInfo.dbName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationApp;