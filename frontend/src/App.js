import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './LandingPage';
import SuperAdminDashboard from './SuperAdminDashboard';
import LocationApp from './LocationApp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { 
  Search, 
  Plus, 
  Clock, 
  MapPin, 
  DollarSign, 
  LogOut, 
  Users, 
  CheckCircle, 
  X,
  Key,
  Calendar,
  FileText,
  Settings,
  User,
  Lock,
  ShoppingCart,
  CreditCard,
  Camera
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import MembershipForm from './MembershipForm';

const API = process.env.REACT_APP_BACKEND_URL;

function App({ locationId }) {
  
  // Authentication state - initialized from localStorage to avoid hydration issues
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // General state
  const [loading, setLoading] = useState(false);
  
  // Customer management state
  const [customers, setCustomers] = useState([]);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    id_expiration_date: '',
    state_of_id: ''
  });
  
  // Dialog state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showOvertimePayment, setShowOvertimePayment] = useState(false);
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false);
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  const [selectedRoomForManagement, setSelectedRoomForManagement] = useState(null);
  
  // ID Scanner states
  const [showIdScanner, setShowIdScanner] = useState(false);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [idScanLoading, setIdScanLoading] = useState(false);

  // Removed debugging useEffect that could cause hook ordering issues
  
  // Check-in state
  const [checkinForm, setCheckinForm] = useState({
    membership_type: '',
    accommodation_type: '',
    room_type: '',
    room_number: ''
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomDetails, setRoomDetails] = useState([]);
  const [activeCheckins, setActiveCheckins] = useState([]);
  
  // Payment state
  const [paymentData, setPaymentData] = useState({
    checkInId: '',
    customerName: '',
    totalAmount: 0,
    paymentMethod: '',
    additionalItems: [],
    selectedDiscount: null,
    discountAmount: 0,
    transactionType: 'checkin'
  });
  const [additionalItems, setAdditionalItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [adminDiscounts, setAdminDiscounts] = useState([]);
  const [adminItems, setAdminItems] = useState([]);
  
  // Edit state
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showEditDiscount, setShowEditDiscount] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditItem, setShowEditItem] = useState(false);
  
  // Map state
  const [roomMap, setRoomMap] = useState({
    lockers: [],
    rooms: []
  });
  
  // QR state
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Sales reports state
  const [salesData, setSalesData] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Employee management state
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'employee' });
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  
  // Manager override for waitlist enforcement
  const [showManagerOverride, setShowManagerOverride] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [pendingCheckinData, setPendingCheckinData] = useState(null);
  const [waitlistConflictMessage, setWaitlistConflictMessage] = useState('');
  
  // Waitlist state
  const [waitlist, setWaitlist] = useState({
    waitlists: {
      regular_room: [],
      small_room: [],
      deluxe_room: []
    },
    available_rooms: {
      regular_room: [],
      small_room: [],
      deluxe_room: []
    },
    available_rooms_summary: {
      regular_room: 0,
      small_room: 0,
      deluxe_room: 0
    }
  });
  
  // Room upgrade state
  const [upgradeData, setUpgradeData] = useState({
    new_room_type: '',
    new_room_number: ''
  });
  
  // Customer profile state
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);
  const [profileNotes, setProfileNotes] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [customerMembershipStatus, setCustomerMembershipStatus] = useState(null);
  
  // Overtime payment state
  const [overtimeCustomer, setOvertimeCustomer] = useState(null);
  const [overtimePaymentMethod, setOvertimePaymentMethod] = useState('cash');
  
  // Admin state
  const [newDiscount, setNewDiscount] = useState({ name: '', amount: '', description: '' });
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'general' });
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    targetUserId: '',
    targetUsername: ''
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogType, setPasswordDialogType] = useState('change'); // 'change' or 'reset'
  
  // Pricing state
  const [pricingConfig, setPricingConfig] = useState({
    locker_weekday: 25.0,
    locker_weekend: 28.0,
    small_room_weekday: 33.0,    // Regular Room
    small_room_weekend: 36.0,     // Regular Room  
    regular_room_weekday: 40.0,   // Video Room
    regular_room_weekend: 45.0,   // Video Room
    deluxe_room_weekday: 45.0,    // Large Video Room
    deluxe_room_weekend: 50.0     // Large Video Room
  });
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  
  // Current transaction state for building up transactions
  const [currentTransaction, setCurrentTransaction] = useState({
    customer: null,
    items: [],
    subtotal: 0,
    discount: null,
    discountAmount: 0,
    total: 0
  });
  const [showCurrentTransaction, setShowCurrentTransaction] = useState(false);
  
  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundNotes, setRefundNotes] = useState('');

  // Customer overtime checkout state
  const [checkoutOvertimeData, setCheckoutOvertimeData] = useState(null);

  // Dynamic favicon badge for overtime customers
  const updateFaviconBadge = (overtimeCount) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 32;
    canvas.width = size;
    canvas.height = size;

    // Draw red circle background
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw white text
    if (overtimeCount > 0) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = overtimeCount > 99 ? '99+' : overtimeCount.toString();
      ctx.fillText(text, size / 2, size / 2);
    }

    // Create favicon link
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = canvas.toDataURL();
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  // Update favicon when active check-ins change
  useEffect(() => {
    if (isAuthenticated && activeCheckins && activeCheckins.length > 0) {
      const overtimeCustomers = activeCheckins.filter(checkin => 
        checkin.is_overtime || (checkin.remaining_hours && checkin.remaining_hours < 0)
      );
      updateFaviconBadge(overtimeCustomers.length);
    } else if (isAuthenticated) {
      updateFaviconBadge(0);
    }
  }, [activeCheckins, isAuthenticated]);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 App: Checking authentication on mount');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userData);
    console.log('Current isAuthenticated state:', isAuthenticated);
    
    if (token && userData) {
      console.log('✅ App: Setting authenticated state to true');
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    } else {
      console.log('❌ App: No authentication found');
    }
  }, []);

  // Location information
  const locations = {
    'los-angeles': { name: 'Los Angeles', address: '4424 Melrose Ave, Los Angeles, CA 90004' },
    'atlanta': { name: 'Atlanta', address: '76 4th St NW, Atlanta, GA 30308' },
    'cleveland': { name: 'Cleveland', address: '2600 Hamilton Ave, Cleveland, OH 44114' },
    'phoenix': { name: 'Phoenix', address: '1517 S Black Canyon Hwy, Phoenix, AZ 85009' }
  };

  const currentLocation = locations[locationId] || null;

  // Login function for location-specific authentication
  const locationLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔐 Starting login process...');
      console.log('Location ID:', locationId);
      console.log('Login form:', loginForm);
      
      const headers = { 'Content-Type': 'application/json' };
      if (locationId) {
        headers['X-Location'] = locationId;
      }
      
      console.log('📤 Sending login request...');
      const response = await axios.post(`${API}/api/login`, loginForm, { headers });
      console.log('✅ Login response received:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      if (locationId) {
        localStorage.setItem('currentLocation', locationId);
      }
      
      console.log('🔓 Setting authentication state...');
      console.log('User data:', userData);
      
      setIsAuthenticated(true);
      setUser(userData);
      setLoginForm({ username: '', password: '' });
      
      console.log('✅ Authentication state updated successfully');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Invalid credentials. Please check your username and password.');
    }
    
    setLoading(false);
  };

  // Add useEffect to monitor authentication state changes
  useEffect(() => {
    console.log('🔍 Authentication state changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('✅ User is now authenticated, should show admin interface');
      console.log('Current user:', user);
    } else {
      console.log('❌ User is not authenticated, showing login form');
    }
  }, [isAuthenticated, user]);

  // Use existing LoginPage component with location context
  const LocationLoginComponent = () => <LoginPage locationId={locationId} locationName={currentLocation?.name} />;

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingCustomers();
      fetchAdditionalItems();
      fetchDiscounts();
      fetchAdminDiscounts();
      fetchAdminItems();
      fetchActiveCheckins();
      generateQRCode();
      fetchWaitlist();
      
      if (user?.role === 'manager') {
        fetchEmployees();
        fetchPricing();
        fetchTransactions();
      }
      
      // Fetch room map data
      fetchRoomMap();
    }
  }, [isAuthenticated, user]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add location context if available
      const currentLocation = localStorage.getItem('currentLocation');
      if (currentLocation) {
        headers['X-Location'] = currentLocation;
      }
      
      const response = await axios.post(`${API}/api/login`, loginForm, { headers });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Force a page refresh by navigating to the same location
      // This ensures the App component re-initializes with the new authentication state
      window.location.href = window.location.pathname;
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials. Please check your username and password.');
    }
    
    setLoading(false);
  };

  // Utility function for handling token errors
  const handleTokenError = (error, defaultMessage = 'An error occurred') => {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data?.message || 'Unknown error';
      
      if (status === 401 && (detail === 'Token expired' || detail.includes('expired'))) {
        alert('Your session has expired. Please log in again.');
        logout();
        return;
      } else if (status === 401 || status === 403) {
        alert('Authentication failed. Please log in again.');
        logout();
        return;
      } else {
        alert(`${defaultMessage}: ${detail}`);
      }
    } else if (error.request) {
      alert('Network error. Please check your connection and try again.');
    } else {
      alert(`${defaultMessage}: An unexpected error occurred.`);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentLocation');
    setIsAuthenticated(false);
    setUser(null);
    // Redirect to landing page
    window.location.href = '/';
  };

  const searchCustomers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await axios.get(`${API}/api/customers?q=${searchQuery}`, { headers });
      
      if (response.data && Array.isArray(response.data)) {
        setCustomers(response.data);
        if (response.data.length === 0) {
          alert(`No customers found matching "${searchQuery}"`);
        }
      } else {
        console.error('Invalid response format:', response.data);
        alert('Received invalid response from server');
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message || 'Unknown server error';
        
        if (status === 401 || status === 403) {
          alert('Authentication failed. Please log in again.');
          // Optionally redirect to login
        } else if (status === 500) {
          alert('Server error occurred. Please try again later.');
        } else {
          alert(`Search failed: ${message} (Status: ${status})`);
        }
      } else if (error.request) {
        // Network error
        alert('Network error. Please check your connection and try again.');
      } else {
        // Other error
        alert('An unexpected error occurred while searching customers.');
      }
    }
    setLoading(false);
  };

  const fetchPendingCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/pending-customers`, { headers });
      setPendingCustomers(response.data);
    } catch (error) {
      console.error('Error fetching pending customers:', error);
    }
  };

  const approvePendingCustomer = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await axios.post(`${API}/api/pending-customers/${customerId}/approve`, {}, { headers });
      console.log('Customer approved:', response.data);
      fetchPendingCustomers(); // Refresh the list
      // Also refresh main customers list if they have been searching
      if (searchQuery) {
        searchCustomers();
      }
    } catch (error) {
      console.error('Error approving customer:', error);
      alert('Error approving customer: ' + (error.response?.data?.detail || error.message));
    }
  };

  const rejectPendingCustomer = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/pending-customers/${customerId}`, { headers });
      fetchPendingCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting customer:', error);
      alert('Error rejecting customer');
    }
  };

  const fetchActiveCheckins = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/checkins/active`, { headers });
      setActiveCheckins(response.data);
    } catch (error) {
      console.error('Error fetching active check-ins:', error);
    }
  };

  const fetchAdditionalItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/additional-items`, { headers });
      setAdditionalItems(response.data);
    } catch (error) {
      console.error('Error fetching additional items:', error);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/discounts`, { headers });
      setDiscounts(response.data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const fetchAdminDiscounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/admin/discounts`, { headers });
      setAdminDiscounts(response.data);
    } catch (error) {
      console.error('Error fetching admin discounts:', error);
    }
  };

  const fetchAdminItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/admin/additional-items`, { headers });
      setAdminItems(response.data);
    } catch (error) {
      console.error('Error fetching admin items:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Add location header for multi-location support
      if (locationId) {
        headers['X-Location'] = locationId;
      } else if (currentLocation) {
        headers['X-Location'] = currentLocation;
      }
      
      const response = await axios.get(`${API}/api/users`, { headers });
      console.log('✅ Employees fetched:', response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchWaitlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/waitlist`, { headers });
      setWaitlist(response.data);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  // ID Scanning Functions
  const scanIdWithFile = async (file) => {
    setIdScanLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      // Add location header for multi-location support
      if (locationId) {
        headers['X-Location'] = locationId;
      } else if (currentLocation) {
        headers['X-Location'] = currentLocation;
      }

      const response = await axios.post(`${API}/api/scan/id`, formData, { headers });
      
      if (response.data.success) {
        setScannedIdData(response.data.data);
        // Auto-fill the add customer form with scanned data
        setNewCustomer({
          first_name: response.data.data.first_name || '',
          last_name: response.data.data.last_name || '',
          email: '',  // ID doesn't contain email
          phone: '',  // ID doesn't contain phone
          date_of_birth: response.data.data.date_of_birth || '',
          address: response.data.data.address || '',
          city: response.data.data.city || '',
          state: response.data.data.state || '',
          zip_code: response.data.data.zip_code || '',
          id_number: response.data.data.id_number || '',
          id_expiration: response.data.data.expiration_date || ''
        });
        
        console.log('✅ ID scanned successfully:', response.data.data);
        alert('ID scanned successfully! Customer information has been pre-filled.');
        setShowIdScanner(false);
        setShowAddCustomer(true);  // Open the add customer form
      } else {
        alert(`ID scanning failed: ${response.data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('ID scanning error:', error);
      if (error.response?.status === 400) {
        alert(`File error: ${error.response.data.detail}`);
      } else {
        alert('ID scanning failed. Please try again or add customer information manually.');
      }
    } finally {
      setIdScanLoading(false);
    }
  };

  const handleIdScanFromCamera = async () => {
    // Check if device supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported on this device. Please use file upload instead.');
      return;
    }

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',  // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Create video element for preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // We'll implement the camera capture UI in the modal
      // For now, just show alert about camera access
      alert('Camera access granted! Camera scanning interface will be available in the modal.');
      
      // Stop the stream for now
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Camera access denied or not available. Please use file upload instead.');
    }
  };

  const upgradeFromWaitlist = async (entryId, roomNumber, roomType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Step 1: Prepare waitlist upgrade (calculate costs, check availability, but don't apply yet)
      const response = await axios.post(`${API}/api/waitlist/${entryId}/upgrade/prepare`, {
        room_number: roomNumber,
        room_type: roomType
      }, { headers });
      
      // Find the customer info for this waitlist entry
      let customerName = "Customer";
      let customerId = null;
      
      // Look for the customer in the waitlist data
      for (const [listType, entries] of Object.entries(waitlist.waitlists || {})) {
        const entry = entries.find(e => e.id === entryId);
        if (entry && entry.customer) {
          customerName = `${entry.customer.first_name} ${entry.customer.last_name}`;
          customerId = entry.customer.id;
          break;
        }
      }
      
      // Set up payment dialog for waitlist upgrade
      setPaymentData({
        checkInId: null, // Not applicable for waitlist upgrades
        customerName: customerName,
        customerId: customerId,
        totalAmount: response.data.additional_cost,
        paymentMethod: '',
        additionalItems: [],
        selectedDiscount: null,
        discountAmount: 0,
        transactionType: 'waitlist_upgrade',
        pendingUpgradeId: response.data.pending_upgrade_id, // Store for completion
        waitlistEntryId: entryId, // Store for completion
        upgradeDetails: {
          oldRoom: response.data.old_room,
          newRoom: response.data.new_room,
          upgradeFee: response.data.upgrade_fee,
          cleaningFee: response.data.cleaning_fee
        }
      });
      
      // Open payment dialog to finalize transaction
      setShowPayment(true);
      
    } catch (error) {
      console.error('Error preparing waitlist upgrade:', error);
      handleTokenError(error, 'Error preparing waitlist upgrade');
    }
  };

  const addFromCheckinToWaitlist = async (checkinId, desiredRoomType) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.post(`${API}/api/waitlist/add-from-checkin/${checkinId}`, {
        desired_room_type: desiredRoomType
      }, { headers });
      
      alert('Customer added to waitlist successfully!');
      fetchWaitlist();
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert(error.response?.data?.detail || 'Error adding to waitlist');
    }
  };

  const addToAllWaitlists = async (checkinId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Add to all three waitlists
      const waitlistTypes = ['regular_room', 'small_room', 'deluxe_room'];
      
      for (const roomType of waitlistTypes) {
        await axios.post(`${API}/api/waitlist/add-from-checkin/${checkinId}`, {
          desired_room_type: roomType
        }, { headers });
      }
      
      alert('Customer added to all waitlists successfully!');
      fetchWaitlist();
    } catch (error) {
      console.error('Error adding to all waitlists:', error);
      alert(error.response?.data?.detail || 'Error adding to waitlists');
    }
  };

  const removeFromWaitlist = async (entryId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await axios.delete(`${API}/api/waitlist/${entryId}`, { headers });
      
      alert('Customer removed from all waitlists');
      fetchWaitlist();
      
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      handleTokenError(error, 'Error removing from waitlist');
    }
  };

  const checkCustomerMembershipStatus = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/customers/${customerId}/membership-status`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error checking membership status:', error);
      return null;
    }
  };

  const generateQRCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/qr/membership-form`, { headers });
      setQrCodeUrl(response.data.qr_code_url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const fetchSalesReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/reports/daily-sales?date=${selectedDate}`, { headers });
      setSalesData(response.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
      alert('Error fetching sales report');
    }
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Add location header for multi-location support
      if (locationId) {
        headers['X-Location'] = locationId;
      } else if (currentLocation) {
        headers['X-Location'] = currentLocation;
      }
      
      console.log('🔧 Adding employee with headers:', headers);
      await axios.post(`${API}/api/users`, newEmployee, { headers });
      setNewEmployee({ username: '', password: '', role: 'employee' });
      setShowAddEmployee(false);
      
      console.log('✅ Employee added, refreshing list...');
      fetchEmployees();
      alert('Employee added successfully!');
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(error.response?.data?.detail || 'Error adding employee');
    }
    
    setLoading(false);
  };

  const deleteEmployee = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/users/${userId}`, { headers });
      fetchEmployees();
      alert('Employee deleted successfully!');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(error.response?.data?.detail || 'Error deleting employee');
    }
  };

  const assignLockerToEmployee = async (userId, lockerNumber) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/api/users/${userId}/assign-locker`, { locker_number: lockerNumber }, { headers });
      fetchEmployees();
      fetchRoomMap(); // Refresh room map to update locker availability
      alert(`Locker ${lockerNumber} assigned successfully!`);
    } catch (error) {
      console.error('Error assigning locker:', error);
      alert(error.response?.data?.detail || 'Error assigning locker');
    }
  };

  const unassignLockerFromEmployee = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/users/${userId}/assign-locker`, { headers });
      fetchEmployees();
      fetchRoomMap(); // Refresh room map to update locker availability
      alert('Locker unassigned successfully!');
    } catch (error) {
      console.error('Error unassigning locker:', error);
      alert(error.response?.data?.detail || 'Error unassigning locker');
    }
  };

  const performRoomUpgrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Step 1: Prepare upgrade (calculate costs, check availability, but don't apply yet)
      const response = await axios.post(`${API}/api/checkin/${selectedCheckin.id}/upgrade/prepare`, {
        new_room_type: upgradeData.new_room_type,
        new_room_number: parseInt(upgradeData.new_room_number)
      }, { headers });
      
      // Set up payment dialog for room upgrade
      const customerName = `${selectedCheckin.customer?.first_name} ${selectedCheckin.customer?.last_name}`;
      
      setPaymentData({
        checkInId: selectedCheckin.id,
        customerName: customerName,
        customerId: selectedCheckin.customer?.id,
        totalAmount: response.data.additional_cost,
        paymentMethod: '',
        additionalItems: [],
        selectedDiscount: null,
        discountAmount: 0,
        transactionType: 'room_upgrade',
        pendingUpgradeId: response.data.pending_upgrade_id, // Store for completion
        upgradeDetails: {
          oldRoom: response.data.old_room,
          newRoom: response.data.new_room,
          upgradeFee: response.data.upgrade_fee,
          cleaningFee: response.data.cleaning_fee
        }
      });
      
      setShowUpgrade(false);
      setUpgradeData({ new_room_type: '', new_room_number: '' });
      setSelectedCheckin(null);
      
      // Open payment dialog to finalize transaction
      setShowPayment(true);
      
    } catch (error) {
      console.error('Error preparing room upgrade:', error);
      alert(error.response?.data?.detail || 'Error preparing room upgrade');
    }
    
    setLoading(false);
  };

  const openCustomerProfile = async (customer) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/customers/${customer.id}/profile`, { headers });
      setSelectedCustomerProfile(response.data);
      setProfileNotes(response.data.customer.notes || '');
      setShowProfile(true);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      alert('Error loading customer profile');
    }
  };

  const payOvertimeFees = async (customerId, paymentMethod) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.post(`${API}/api/customers/${customerId}/pay-overtime`, {
        payment_method: paymentMethod
      }, { headers });
      
      alert(`Overtime fees paid successfully! Amount: $${response.data.amount_paid.toFixed(2)}`);
      setShowOvertimePayment(false);
      setOvertimeCustomer(null);
      
      // Refresh customer search if there's a query
      if (searchQuery) {
        searchCustomers();
      }
      
    } catch (error) {
      console.error('Error paying overtime fees:', error);
      alert(error.response?.data?.detail || 'Error processing payment');
    }
  };

  const createDiscount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.post(`${API}/api/discounts`, newDiscount, { headers });
      setNewDiscount({ name: '', amount: '', description: '' });
      setShowAddDiscount(false);
      fetchDiscounts();
      fetchAdminDiscounts();
      alert('Discount created successfully!');
    } catch (error) {
      console.error('Error creating discount:', error);
      handleTokenError(error, 'Error creating discount');
    }
  };

  const toggleDiscount = async (discountId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/api/discounts/${discountId}/toggle`, {}, { headers });
      fetchDiscounts();
      fetchAdminDiscounts();
      alert(`Discount ${currentStatus ? 'disabled' : 'enabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling discount:', error);
      alert('Error updating discount');
    }
  };

  const updateDiscount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.put(`${API}/api/discounts/${editingDiscount.id}`, {
        name: editingDiscount.name,
        amount: parseFloat(editingDiscount.amount),
        description: editingDiscount.description
      }, { headers });
      
      setEditingDiscount(null);
      setShowEditDiscount(false);
      fetchDiscounts();
      fetchAdminDiscounts();
      alert('Discount updated successfully!');
    } catch (error) {
      console.error('Error updating discount:', error);
      handleTokenError(error, 'Error updating discount');
    }
  };

  const deleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to permanently delete this discount? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      // Use hard delete endpoint to permanently remove from database
      await axios.delete(`${API}/api/admin/discounts/${discountId}/hard-delete`, { headers });
      fetchDiscounts();
      fetchAdminDiscounts();
      alert('Discount permanently deleted from database!');
    } catch (error) {
      console.error('Error deleting discount:', error);
      handleTokenError(error, 'Error deleting discount');
    }
  };

  const createAdditionalItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.post(`${API}/api/additional-items`, {
        ...newItem,
        price: parseFloat(newItem.price)
      }, { headers });
      setNewItem({ name: '', price: '', category: 'general' });
      setShowAddItem(false);
      fetchAdditionalItems();
      fetchAdminItems();
      alert('Additional item created successfully!');
    } catch (error) {
      console.error('Error creating additional item:', error);
      handleTokenError(error, 'Error creating additional item');
    }
  };

  const toggleAdditionalItem = async (itemId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/api/additional-items/${itemId}/toggle`, {}, { headers });
      fetchAdditionalItems();
      fetchAdminItems();
      alert(`Item ${currentStatus ? 'disabled' : 'enabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling item:', error);
      alert('Error updating item');
    }
  };

  const updateAdditionalItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.put(`${API}/api/additional-items/${editingItem.id}`, {
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        category: editingItem.category
      }, { headers });
      
      setEditingItem(null);
      setShowEditItem(false);
      fetchAdditionalItems();
      fetchAdminItems();
      alert('Additional item updated successfully!');
    } catch (error) {
      console.error('Error updating additional item:', error);
      handleTokenError(error, 'Error updating additional item');
    }
  };

  const deleteAdditionalItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue.');
        logout();
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      // Use hard delete endpoint to permanently remove from database
      await axios.delete(`${API}/api/admin/additional-items/${itemId}/hard-delete`, { headers });
      fetchAdditionalItems();
      fetchAdminItems();
      alert('Additional item permanently deleted from database!');
    } catch (error) {
      console.error('Error deleting additional item:', error);
      handleTokenError(error, 'Error deleting additional item');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      if (passwordDialogType === 'change') {
        await axios.put(`${API}/api/users/me/password`, {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        }, { headers });
        alert('Your password has been changed successfully!');
      } else {
        await axios.put(`${API}/api/users/${passwordForm.targetUserId}/password`, {
          new_password: passwordForm.newPassword
        }, { headers });
        alert(`Password reset successfully for ${passwordForm.targetUsername}!`);
      }
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        targetUserId: '',
        targetUsername: ''
      });
      setShowPasswordDialog(false);
      
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.detail || 'Error changing password');
    }
  };

  const printReceipt = (customer, checkInData, paymentData) => {
    const receiptContent = `
      <div style="width: 300px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; background: white; color: black; padding: 20px; margin: 0;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 18px;">
            <img src="https://customer-assets.emergentagent.com/job_bathhouse-admin/artifacts/vytho0m6_IMG_3221%202.jpg" alt="Flex Spa Los Angeles" style="max-height: 30px; object-fit: contain; display: block; margin: 0 auto;" />
          </h2>
          <p style="margin: 5px 0; font-size: 10px;">123 Spa Street, Los Angeles, CA 90210</p>
          <p style="margin: 2px 0; font-size: 10px;">Phone: (555) 123-FLEX</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="margin: 2px 0;"><strong>Customer:</strong> ${customer.first_name} ${customer.last_name}</p>
          <p style="margin: 2px 0;"><strong>ID Number:</strong> ${customer.id_number}</p>
          <p style="margin: 2px 0;"><strong>Employee:</strong> ${user?.username}</p>
          <p style="margin: 2px 0;"><strong>Date/Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 15px;">
          <p style="margin: 2px 0;"><strong>Check-in Details:</strong></p>
          <p style="margin: 2px 0;">  ${checkInData.room_type?.replace('_', ' ').toUpperCase()} #${checkInData.room_number}</p>
          <p style="margin: 2px 0;">  Membership: ${checkInData.membership_type?.replace('_', ' ').toUpperCase()}</p>
        </div>
        
        <div style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 15px;">
          <p style="margin: 2px 0;"><strong>Payment Method:</strong> ${paymentData.paymentMethod?.toUpperCase()}</p>
          <p style="margin: 2px 0;"><strong>Total Amount:</strong> $${paymentData.totalAmount?.toFixed(2)}</p>
          ${paymentData.additionalItems && paymentData.additionalItems.length > 0 ? 
            paymentData.additionalItems.map(item => 
              `<p style="margin: 2px 0; font-size: 11px;">  ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}</p>`
            ).join('') : ''
          }
          ${paymentData.selectedDiscount ? 
            `<p style="margin: 2px 0; font-size: 11px; color: green;">  Discount (${paymentData.selectedDiscount.name}): -$${paymentData.discountAmount?.toFixed(2)}</p>` : ''
          }
        </div>
        
        <div style="text-align: center; border-top: 2px solid #000; padding-top: 10px; font-size: 11px;">
          <p style="margin: 2px 0;">Thank you for visiting!</p>
          <p style="margin: 2px 0;">Keep this receipt for your records</p>
          <p style="margin: 2px 0;">${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>FLEX SPA Receipt</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${receiptContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const saveProfileNotes = async () => {
    if (!selectedCustomerProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await axios.put(`${API}/api/customers/${selectedCustomerProfile.customer.id}/notes`, {
        notes: profileNotes
      }, { headers });
      
      alert('Notes saved successfully!');
      
      // Update the profile data
      setSelectedCustomerProfile({
        ...selectedCustomerProfile,
        customer: {
          ...selectedCustomerProfile.customer,
          notes: profileNotes
        }
      });
      
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error saving notes');
    }
  };

  const fetchRoomMap = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [lockersRes, smallRoomsRes, regularRoomsRes, deluxeRoomsRes, activeCheckinsRes, assignedLockersRes] = await Promise.all([
        axios.get(`${API}/api/rooms/available/locker`, { headers }),
        axios.get(`${API}/api/rooms/available/small_room`, { headers }),
        axios.get(`${API}/api/rooms/available/regular_room`, { headers }),
        axios.get(`${API}/api/rooms/available/deluxe_room`, { headers }),
        axios.get(`${API}/api/checkins/active`, { headers }),
        axios.get(`${API}/api/users/assigned-lockers`, { headers })
      ]);

      // Get occupied rooms from active check-ins
      const occupiedRooms = activeCheckinsRes.data.map(checkin => ({
        number: checkin.room_number,
        type: checkin.room_type,
        customer: `${checkin.customer?.first_name} ${checkin.customer?.last_name}`,
        remaining_hours: checkin.remaining_hours,
        checkout_time: checkin.checkout_time,
        is_overtime: checkin.is_overtime,
        checkin_id: checkin.id
      }));

      // Get employee assigned lockers
      const assignedLockers = assignedLockersRes.data;
      console.log('Assigned lockers:', assignedLockers); // Debug log
      console.log('Occupied rooms:', occupiedRooms); // Debug log

      // Create complete room map
      const allLockers = Array.from({length: 114}, (_, i) => i + 40); // 40-153
      const allSmallRooms = Array.from({length: 18}, (_, i) => i + 7); // 7-24
      const allRegularRooms = [...Array.from({length: 6}, (_, i) => i + 1), ...Array.from({length: 8}, (_, i) => i + 25)]; // 1-6, 25-32
      const allDeluxeRooms = Array.from({length: 6}, (_, i) => i + 34); // 34-39

      const mapLockers = allLockers.map(num => {
        const occupied = occupiedRooms.find(r => r.number === num && r.type === 'locker');
        const employeeAssigned = assignedLockers[num.toString()];
        
        return {
          number: num,
          type: 'locker',
          available: !occupied && !employeeAssigned, // Available if NOT occupied AND NOT assigned to employee
          customer: occupied ? occupied.customer : null,
          employee_assigned: employeeAssigned ? employeeAssigned.employee_username : null,
          remaining_hours: occupied ? occupied.remaining_hours : null,
          checkout_time: occupied ? occupied.checkout_time : null,
          is_overtime: occupied ? occupied.is_overtime : false,
          checkin_id: occupied ? occupied.checkin_id : null
        };
      });

      const mapRooms = [
        ...allSmallRooms.map(num => {
          const occupied = occupiedRooms.find(r => r.number === num && r.type === 'small_room');
          return {
            number: num,
            type: 'small_room',
            label: 'Regular Room',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'green',
            remaining_hours: occupied ? occupied.remaining_hours : null,
            checkout_time: occupied ? occupied.checkout_time : null,
            is_overtime: occupied ? occupied.is_overtime : false,
            checkin_id: occupied ? occupied.checkin_id : null
          };
        }),
        ...allRegularRooms.map(num => {
          const occupied = occupiedRooms.find(r => r.number === num && r.type === 'regular_room');
          return {
            number: num,
            type: 'regular_room',
            label: 'Video Room',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'purple',
            remaining_hours: occupied ? occupied.remaining_hours : null,
            checkout_time: occupied ? occupied.checkout_time : null,
            is_overtime: occupied ? occupied.is_overtime : false,
            checkin_id: occupied ? occupied.checkin_id : null
          };
        }),
        ...allDeluxeRooms.map(num => {
          const occupied = occupiedRooms.find(r => r.number === num && r.type === 'deluxe_room');
          return {
            number: num,
            type: 'deluxe_room',
            label: 'Large Video Room',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'gold',
            remaining_hours: occupied ? occupied.remaining_hours : null,
            checkout_time: occupied ? occupied.checkout_time : null,
            is_overtime: occupied ? occupied.is_overtime : false,
            checkin_id: occupied ? occupied.checkin_id : null
          };
        })
      ];

      setRoomMap({
        lockers: mapLockers,
        rooms: mapRooms.sort((a, b) => a.number - b.number)
      });

      console.log('Room map updated:', { lockers: mapLockers.length, rooms: mapRooms.length }); // Debug log
    } catch (error) {
      console.error('Error fetching room map:', error);
    }
  };

  const addCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post(`${API}/api/customers`, customerForm, { headers });
      setCustomerForm({
        first_name: '',
        last_name: '',
        id_number: '',
        date_of_birth: '',
        id_expiration_date: '',
        state_of_id: ''
      });
      setShowAddCustomer(false);
      
      // Refresh search if there's a query
      if (searchQuery) {
        searchCustomers();
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert(error.response?.data?.detail || 'Error adding customer');
    }
    setLoading(false);
  };

  const fetchAvailableRooms = async (roomType) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      console.log(`🏠 Fetching available rooms for type: ${roomType}`);
      const response = await axios.get(`${API}/api/rooms/available/${roomType}`, { headers });
      console.log(`🏠 Available rooms response:`, response.data);
      setAvailableRooms(response.data.available_rooms || []);
      setRoomDetails(response.data.room_details || []);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setAvailableRooms([]);
    }
  };

  const handleSuccessfulCheckinPrepare = (responseData, customer) => {
    // Handle membership validation message
    if (responseData.membership_status) {
      if (responseData.membership_status.using_existing) {
        alert(`✅ Using existing membership! Valid until ${new Date(responseData.membership_status.expiration_date).toLocaleDateString()}`);
      }
    }
    
    // Set up payment data with pending check-in ID for completion
    const paymentInfo = {
      checkInId: null, // Will be set after completion
      customerName: `${customer.first_name} ${customer.last_name}`,
      customerId: customer.id,
      totalAmount: responseData.total_amount,
      paymentMethod: '',
      additionalItems: [],
      selectedDiscount: null,
      discountAmount: 0,
      transactionType: 'checkin',
      pendingCheckinId: responseData.pending_checkin_id, // Store for completion
      checkinDetails: {
        roomType: responseData.room_type,
        roomNumber: responseData.room_number,
        membershipType: responseData.membership_type,
        membershipStatus: responseData.membership_status
      }
    };

    console.log('💰 Setting payment data:', JSON.stringify(paymentInfo, null, 2));

    setPaymentData(paymentInfo);
    setCheckinForm({ 
      membership_type: '', 
      room_type: 'locker', 
      room_number: '' 
    });
    setSelectedCustomer(null);
    setShowCheckIn(false);
    setShowPayment(true);
    
    console.log('🎉 Check-in prepare completed - payment dialog shown');
  };

  const handleCheckIn = async (e) => {
    console.log('🚀 handleCheckIn function START');
    
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    setLoading(true);
    console.log('⏳ Loading state set to true');

    try {
      // Debug logging
      console.log('📋 Form state before submission:', JSON.stringify(checkinForm, null, 2));
      console.log('👤 Selected customer:', JSON.stringify(selectedCustomer, null, 2));

      // Validate required fields
      // Only require membership_type if customer doesn't have valid membership
      if (!checkinForm.membership_type && (!customerMembershipStatus || !customerMembershipStatus.has_valid_membership)) {
        const msg = 'Please select a membership type';
        console.log('❌ Validation failed:', msg);
        alert(msg);
        setLoading(false);
        return;
      }

      if (!checkinForm.room_number) {
        const msg = 'Please select a room/locker number';
        console.log('❌ Validation failed:', msg);
        alert(msg);
        setLoading(false);
        return;
      }

      if (!selectedCustomer || !selectedCustomer.id) {
        const msg = 'No customer selected';
        console.log('❌ Validation failed:', msg);
        alert(msg);
        setLoading(false);
        return;
      }

      // Determine room_type properly
      let finalRoomType = checkinForm.room_type;
      if (!finalRoomType && checkinForm.accommodation_type === 'locker') {
        finalRoomType = 'locker';
      }

      // Prepare check-in data with proper room_type for backend
      const checkInData = {
        customer_id: selectedCustomer.id,
        membership_type: checkinForm.membership_type || null, // Use null if no membership_type (backend will use existing membership)
        room_type: finalRoomType,
        room_number: parseInt(checkinForm.room_number)
      };

      console.log('📤 Sending check-in data:', JSON.stringify(checkInData, null, 2));
      console.log('🌐 API endpoint:', `${API}/api/checkin/prepare`);

      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      try {
        // Step 1: Prepare check-in (validate, check availability, calculate costs, enforce waitlist, but don't check in yet)
        const response = await axios.post(`${API}/api/checkin/prepare`, checkInData, { headers });
        
        console.log('✅ Check-in prepare response received:', JSON.stringify(response.data, null, 2));
        
        // Proceed with successful check-in
        handleSuccessfulCheckinPrepare(response.data, selectedCustomer);
        
      } catch (error) {
        if (error.response && error.response.status === 409) {
          // Waitlist conflict - show manager override dialog
          setWaitlistConflictMessage(error.response.data.detail);
          setPendingCheckinData(checkInData);
          setShowManagerOverride(true);
          setLoading(false);
          return;
        } else {
          // Other errors - handle normally
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Error checking in customer:', error);
      if (error.response?.data?.detail) {
        alert(`Check-in failed: ${error.response.data.detail}`);
      } else {
        alert('Error checking in customer');
      }
    }
    
    setLoading(false);
  };

  const handleManagerOverride = async () => {
    if (!managerPassword.trim()) {
      alert('Please enter manager password');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Add manager override to the pending check-in data
      const overrideData = {
        ...pendingCheckinData,
        manager_override: true,
        manager_password: managerPassword
      };
      
      // Retry check-in prepare with manager override
      const response = await axios.post(`${API}/api/checkin/prepare`, overrideData, { headers });
      
      console.log('✅ Manager override successful:', JSON.stringify(response.data, null, 2));
      
      // Close override dialog and proceed with check-in
      setShowManagerOverride(false);
      setManagerPassword('');
      setPendingCheckinData(null);
      setWaitlistConflictMessage('');
      
      // Proceed with successful check-in
      handleSuccessfulCheckinPrepare(response.data, selectedCustomer);
      
    } catch (error) {
      console.error('Manager override error:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(`Manager override failed: ${error.response.data.detail}`);
      } else {
        alert('Manager override failed. Please check your password.');
      }
    }
    setLoading(false);
  };

  const cancelManagerOverride = () => {
    setShowManagerOverride(false);
    setManagerPassword('');
    setPendingCheckinData(null);
    setWaitlistConflictMessage('');
    setLoading(false);
  };

  const handlePaymentComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Add location header for multi-location support
      const currentLocation = localStorage.getItem('currentLocation');
      if (currentLocation) {
        headers['X-Location'] = currentLocation;
      }
      
      // Create transaction record for all transaction types
      const transactionData = {
        customer_id: paymentData.customerId || selectedCustomer?.id || '',
        customer_name: paymentData.customerName,
        transaction_type: paymentData.transactionType,
        items: paymentData.additionalItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: 1
        })),
        subtotal: paymentData.totalAmount + (paymentData.selectedDiscount?.amount || 0),
        discount_name: paymentData.selectedDiscount?.name || null,
        discount_amount: paymentData.discountAmount,
        total_amount: paymentData.totalAmount,
        payment_method: paymentData.paymentMethod,
        checkin_id: paymentData.checkInId || null,
        membership_type: paymentData.membershipType || null,
        created_by: user?.id || '',
        notes: null
      };
      
      // Handle different transaction types
      if (paymentData.transactionType === 'overtime') {
        // Handle overtime payment - call backend to process payment and create transaction
        const response = await axios.post(`${API}/api/customers/${paymentData.customerId || selectedCustomer?.id}/pay-overtime`, {
          payment_method: paymentData.paymentMethod
        }, { headers });
        
        alert(`✅ Overtime payment completed successfully!\n\nAmount paid: $${response.data.amount_paid.toFixed(2)}\nPayment method: ${paymentData.paymentMethod.toUpperCase()}`);
        
      } else if (paymentData.transactionType === 'room_upgrade') {
        // Handle room upgrade transaction - complete the upgrade AFTER payment
        
        // Step 1: Complete the room upgrade (apply the room change)
        const upgradeResponse = await axios.post(`${API}/api/checkin/${paymentData.checkInId}/upgrade/complete`, {
          pending_upgrade_id: paymentData.pendingUpgradeId
        }, { headers });
        
        // Step 2: Create transaction record for accounting
        await axios.post(`${API}/api/transactions`, transactionData, { headers });
        
        alert(`✅ Room upgrade completed successfully!\n\nUpgraded from: ${paymentData.upgradeDetails?.oldRoom}\nUpgraded to: ${paymentData.upgradeDetails?.newRoom}\nTotal paid: $${paymentData.totalAmount.toFixed(2)}\nPayment method: ${paymentData.paymentMethod.toUpperCase()}`);
        
        // Refresh data to show updated room assignments
        fetchActiveCheckins();
        fetchRoomMap();
      } else if (paymentData.transactionType === 'renewal') {
        // Call renewal API endpoint after payment is complete
        const response = await axios.put(`${API}/api/checkin/${paymentData.checkInId}/renew`, {}, { headers });
        
        // Create transaction record
        await axios.post(`${API}/api/transactions`, transactionData, { headers });
        
        // Show enhanced success message with shift information
        const renewalInfo = response.data;
        const shiftInfo = renewalInfo.total_shifts_today ? 
          `\nShifts used today: ${renewalInfo.total_shifts_today}/3\nRemaining shifts: ${renewalInfo.remaining_shifts}` : '';
        
        alert(`✅ Session renewed successfully for ${paymentData.customerName}!\n\nNew check-out time: ${new Date(renewalInfo.new_checkout_time).toLocaleString()}\nRoom fee: $${renewalInfo.room_fee.toFixed(2)}\nTotal paid: $${paymentData.totalAmount.toFixed(2)}${shiftInfo}`);
        
      } else if (paymentData.transactionType === 'membership') {
        // Handle membership purchase
        // Create transaction record
        await axios.post(`${API}/api/transactions`, transactionData, { headers });
        
        alert(`✅ Membership purchased successfully for ${paymentData.customerName}!\n\nMembership: ${paymentData.membershipType}\nTotal paid: $${paymentData.totalAmount.toFixed(2)}`);
        
      } else if (paymentData.transactionType === 'standalone') {
        // Handle standalone transaction (additional items, etc.)
        // Create transaction record
        await axios.post(`${API}/api/transactions`, transactionData, { headers });
        
        alert(`✅ Transaction completed successfully for ${paymentData.customerName}!\n\nTotal paid: $${paymentData.totalAmount.toFixed(2)}`);
        
        // Clear current transaction
        clearCurrentTransaction();
        
      } else if (paymentData.transactionType === 'checkin') {
        // Handle check-in transaction - complete the check-in AFTER payment
        
        // Step 1: Complete the check-in (actually check customer in)
        console.log('🔄 Starting check-in completion...');
        const checkinResponse = await axios.post(`${API}/api/checkin/complete`, {
          pending_checkin_id: paymentData.pendingCheckinId
        }, { headers });
        console.log('✅ Check-in completed successfully:', checkinResponse.data);
        
        // Step 2: Create transaction record for accounting
        console.log('🔄 Creating transaction record...');
        const checkinTransactionData = {
          ...transactionData,
          checkin_id: checkinResponse.data.id // Use the actual check-in ID
        };
        const transactionResponse = await axios.post(`${API}/api/transactions`, checkinTransactionData, { headers });
        console.log('✅ Transaction record created successfully:', transactionResponse.data);
        
        // Print receipt with actual check-in details
        if (paymentData.checkinDetails) {
          const checkInData = {
            room_type: paymentData.checkinDetails.roomType,
            room_number: paymentData.checkinDetails.roomNumber,
            membership_type: paymentData.checkinDetails.membershipType,
            check_in_time: new Date(checkinResponse.data.check_in_time)
          };
          printReceipt(paymentData.customerName, paymentData.totalAmount, paymentData.paymentMethod, checkInData);
        }
        
        alert(`✅ Check-in completed successfully for ${paymentData.customerName}!\n\nRoom: ${paymentData.checkinDetails?.roomType?.replace('_', ' ')?.toUpperCase()} #${paymentData.checkinDetails?.roomNumber}\nMembership: ${paymentData.checkinDetails?.membershipType?.replace('_', ' ')}\nTotal paid: $${paymentData.totalAmount.toFixed(2)}\nPayment method: ${paymentData.paymentMethod.toUpperCase()}`);
        
        console.log('✅ Check-in and transaction completed successfully!');
        
      } else {
        // Handle other transaction types (legacy check-in format)
        // Create transaction record
        await axios.post(`${API}/api/transactions`, transactionData, { headers });
        
        // Print receipt before clearing data
        if (selectedCustomer && paymentData.checkInId) {
          const checkInData = {
            room_type: checkinForm.roomType,
            room_number: checkinForm.roomNumber,
            membership_type: checkinForm.membershipType,
            check_in_time: new Date()
          };
          
          printReceipt(selectedCustomer, checkInData, paymentData);
        }
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
      
      // Check if this is a transaction creation error vs other errors
      if (error.response?.status === 401) {
        alert('Authentication error. Please log in again.');
      } else if (error.response?.status === 400) {
        alert(`Transaction error: ${error.response?.data?.detail || 'Invalid request'}`);
      } else if (error.response?.status >= 500) {
        alert(`Server error: ${error.response?.data?.detail || 'Internal server error'}`);
      } else if (error.message && error.message.includes('Network Error')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        // For unknown errors, provide more details and suggest checking transaction history
        console.log('Full error details:', error);
        console.log('Error response:', error.response);
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);
        
        // Check if this might be a false positive (transaction succeeded but with response parsing issues)
        if (error.response?.status === 200 || error.response?.status === 201) {
          console.log('Transaction likely succeeded despite error - status code indicates success');
          alert('Transaction completed successfully!');
          // Don't return - let the dialog close normally
        } else {
          alert(`Error completing transaction. Please check transaction history to verify if it succeeded.\n\nDetails: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
          return; // Don't close dialog for real errors  
        }
      }
    }
    
    // Close payment dialog and reset data
    setShowPayment(false);
    setPaymentData({
      checkInId: '',
      customerName: '',
      totalAmount: 0,
      paymentMethod: '',
      additionalItems: [],
      selectedDiscount: null,
      discountAmount: 0,
      transactionType: 'checkin'
    });
    
    // Refresh data after successful transaction (non-blocking)
    setTimeout(async () => {
      try {
        await fetchActiveCheckins();
        await fetchRoomMap();
        console.log('✅ Data refreshed successfully after transaction');
      } catch (refreshError) {
        console.error('⚠️ Data refresh failed (transaction still succeeded):', refreshError);
      }
    }, 100);
  };

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/pricing`, { headers });
      setPricingConfig(response.data);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const updatePricing = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/api/pricing`, pricingConfig, { headers });
      setShowPricingDialog(false);
      alert('Pricing updated successfully!');
    } catch (error) {
      console.error('Error updating pricing:', error);
      alert(error.response?.data?.detail || 'Error updating pricing');
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/transactions?limit=50`, { headers });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const processRefund = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await axios.post(`${API}/api/transactions/${selectedTransaction.id}/refund?refund_amount=${refundAmount}&notes=${encodeURIComponent(refundNotes)}`, {}, { headers });
      
      alert(`✅ Refund processed successfully!\n\nRefund Amount: $${refundAmount.toFixed(2)}\nOriginal Transaction: ${selectedTransaction.customer_name}\nPayment Method: ${selectedTransaction.payment_method}`);
      
      setShowRefundDialog(false);
      setRefundAmount(0);
      setRefundNotes('');
      setSelectedTransaction(null);
      fetchTransactions(); // Refresh transaction list
      
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(error.response?.data?.detail || 'Error processing refund');
    }
  };

  const addToCurrentTransaction = (item) => {
    setCurrentTransaction(prev => {
      const newItems = [...prev.items, item];
      const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
      const total = subtotal - prev.discountAmount;
      
      return {
        ...prev,
        items: newItems,
        subtotal: subtotal,
        total: Math.max(0, total) // Ensure total is never negative
      };
    });
    
    setShowCurrentTransaction(true);
  };

  const removeFromCurrentTransaction = (index) => {
    setCurrentTransaction(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
      const total = subtotal - prev.discountAmount;
      
      return {
        ...prev,
        items: newItems,
        subtotal: subtotal,
        total: Math.max(0, total)
      };
    });
  };

  const finalizeCurrentTransaction = () => {
    if (currentTransaction.items.length === 0) {
      alert('No items in current transaction');
      return;
    }
    
    // Allow transactions without customer for additional items only
    const hasOnlyAdditionalItems = currentTransaction.items.every(item => item.type === 'additional_item');
    const hasMembershipItems = currentTransaction.items.some(item => item.type === 'membership');
    
    if (hasMembershipItems && !currentTransaction.customer) {
      alert('Please select a customer to purchase memberships');
      return;
    }
    
    // Set up payment data from current transaction
    setPaymentData({
      checkInId: '', // Not applicable for standalone transactions
      customerName: currentTransaction.customer ? 
        `${currentTransaction.customer.first_name} ${currentTransaction.customer.last_name}` : 
        'Walk-in Customer',
      customerId: currentTransaction.customer?.id || null,
      totalAmount: currentTransaction.total,
      paymentMethod: '',
      additionalItems: currentTransaction.items.filter(item => item.type === 'additional_item'),
      selectedDiscount: currentTransaction.discount,
      discountAmount: currentTransaction.discountAmount,
      transactionType: 'standalone'
    });
    
    setShowPayment(true);
  };

  const clearCurrentTransaction = () => {
    setCurrentTransaction({
      customer: null,
      items: [],
      subtotal: 0,
      discount: null,
      discountAmount: 0,
      total: 0
    });
    setShowCurrentTransaction(false);
  };

  const purchaseMembership = (customer, membershipType) => {
    const membershipFees = {
      '1_day': { amount: 10, description: '1 Day Membership' },
      '6_month': { amount: 25, description: '6 Month Membership' }
    };
    
    const membership = membershipFees[membershipType];
    if (!membership) {
      alert('Invalid membership type');
      return;
    }
    
    // Set up payment data for membership purchase
    setPaymentData({
      checkInId: '',
      customerName: `${customer.first_name} ${customer.last_name}`,
      totalAmount: membership.amount,
      paymentMethod: '',
      additionalItems: [],
      selectedDiscount: null,
      discountAmount: 0,
      transactionType: 'membership',
      membershipType: membershipType,
      customerId: customer.id
    });
    
    setShowPayment(true);
  };

  const purchaseAdditionalItem = (customer, item) => {
    // Add item to current transaction or create new transaction
    const transactionItem = {
      type: 'additional_item',
      name: item.name,
      amount: item.price,
      id: item.id
    };
    
    if (currentTransaction.customer && currentTransaction.customer.id === customer.id) {
      // Add to existing transaction
      addToCurrentTransaction(transactionItem);
    } else {
      // Start new transaction
      setCurrentTransaction({
        customer: customer,
        items: [transactionItem],
        subtotal: item.price,
        discount: null,
        discountAmount: 0,
        total: item.price
      });
      setShowCurrentTransaction(true);
    }
  };

  const handleRenewal = async (checkinId, customerName, roomType) => {
    try {
      // First check if renewal is possible (this will show the error to user if limit reached)
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Set up renewal transaction to go through payment dialog
      setPaymentData({
        checkInId: checkinId,
        customerName: customerName,
        totalAmount: getRoomBaseRate(roomType),
        paymentMethod: '',
        additionalItems: [],
        selectedDiscount: null,
        discountAmount: 0,
        transactionType: 'renewal'
      });
      
      // Close any open modals
      setShowRoomManagement(false);
      
      // Open payment dialog for transaction finalization
      setShowPayment(true);
    } catch (error) {
      console.error('Error setting up renewal:', error);
      alert(error.response?.data?.detail || 'Error setting up renewal');
    }
  };

  const handleCheckOut = async (checkinId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.put(`${API}/api/checkin/${checkinId}/checkout`, {}, { headers });
      
      // Check if customer has overtime and needs to pay
      if (response.data.overtime_amount > 0) {
        setCheckoutOvertimeData({
          checkinId: checkinId,
          overtimeAmount: response.data.overtime_amount,
          overtimeHours: response.data.overtime_hours,
          sessionDuration: response.data.session_duration_hours
        });
        setShowOvertimePrompt(true);
      } else {
        // No overtime, just refresh the active check-ins
        fetchActiveCheckins();
      }
    } catch (error) {
      console.error('Error checking out customer:', error);
      alert('Error checking out customer');
    }
  };

  const handleOvertimePayment = async (payNow) => {
    if (payNow) {
      // Set up payment dialog for overtime payment
      const activeCheckin = activeCheckins.find(c => c.id === checkoutOvertimeData.checkinId);
      const customerName = activeCheckin ? `${activeCheckin.customer?.first_name} ${activeCheckin.customer?.last_name}` : 'Customer';
      const customerId = activeCheckin ? activeCheckin.customer?.id : null;
      
      setPaymentData({
        checkInId: checkoutOvertimeData.checkinId,
        customerName: customerName,
        customerId: customerId,
        totalAmount: checkoutOvertimeData.overtimeAmount,
        paymentMethod: '',
        additionalItems: [],
        selectedDiscount: null,
        discountAmount: 0,
        transactionType: 'overtime'
      });
      
      setShowOvertimePrompt(false);
      setShowPayment(true);
    } else {
      // IOU option - overtime is already recorded by backend
      alert(`Overtime of $${checkoutOvertimeData.overtimeAmount.toFixed(2)} recorded as IOU.`);
      setShowOvertimePrompt(false);
      setCheckoutOvertimeData(null);
      fetchActiveCheckins();
    }
  };

  const formatRemainingTime = (hours) => {
    if (hours <= 0) return 'OVERTIME';
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const formatCheckoutTime = (checkoutTimeStr) => {
    if (!checkoutTimeStr) return 'Unknown';
    const checkoutTime = new Date(checkoutTimeStr);
    return checkoutTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleRoomClick = (room) => {
    if (!room.available && room.checkin_id) {
      // Room is occupied, show management modal
      const checkin = activeCheckins.find(c => c.id === room.checkin_id);
      if (checkin) {
        setSelectedRoomForManagement({
          room: room,
          checkin: checkin
        });
        setShowRoomManagement(true);
      }
    }
  };

  const isWeekendTime = () => {
    const now = new Date();
    const weekday = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    const hour = now.getHours();
    
    // Friday (5) at 4pm or later
    if (weekday === 5 && hour >= 16) {
      return true;
    }
    // Saturday (6) or Sunday (0) - all day
    else if (weekday === 6 || weekday === 0) {
      return true;
    }
    // Monday through Thursday - weekday pricing
    else if (weekday >= 1 && weekday <= 4) {
      return false;
    }
    // Friday before 4pm - weekday pricing
    else if (weekday === 5 && hour < 16) {
      return false;
    }
    
    return false;
  };

  const getRoomBaseRate = (roomType) => {
    const isWeekend = isWeekendTime();
    
    const rateMap = {
      'locker': isWeekend ? pricingConfig.locker_weekend : pricingConfig.locker_weekday,
      'small_room': isWeekend ? pricingConfig.small_room_weekend : pricingConfig.small_room_weekday,
      'regular_room': isWeekend ? pricingConfig.regular_room_weekend : pricingConfig.regular_room_weekday,
      'deluxe_room': isWeekend ? pricingConfig.deluxe_room_weekend : pricingConfig.deluxe_room_weekday
    };
    
    return rateMap[roomType] || (isWeekend ? pricingConfig.locker_weekend : pricingConfig.locker_weekday);
  };

  // Show login page for location-specific authentication
  if (!isAuthenticated && locationId && currentLocation) {
    return <LocationLoginComponent />;
  }

  // Redirect to landing page if not authenticated and no location
  if (!isAuthenticated && !locationId) {
    window.location.href = '/';
    return null;
  }

  // Main authenticated dashboard
  return (
    <div className="min-h-screen" style={{
      background: '#0f1419',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(30, 58, 138, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(30, 64, 175, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(23, 37, 84, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 90% 90%, rgba(30, 58, 138, 0.15) 0%, transparent 50%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <header className="header-dark shadow-sm border-b" style={{ background: '#000000', backgroundColor: '#000000' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ background: '#000000', backgroundColor: '#000000' }}>
          <div className="flex justify-between items-center h-16" style={{ background: '#000000', backgroundColor: '#000000' }}>
            <div className="flex items-center">
              <div style={{ background: '#000000', padding: '8px', borderRadius: '4px', marginRight: '12px' }}>
                <img 
                  src="https://customer-assets.emergentagent.com/job_bathhouse-admin/artifacts/vytho0m6_IMG_3221%202.jpg" 
                  alt="Flex Spa Los Angeles"
                  className="h-10 w-auto"
                  style={{ maxHeight: '40px', objectFit: 'contain' }}
                />
              </div>
              <Badge variant="secondary" className="ml-3 badge-manager">
                {user?.role === 'manager' ? 'Manager' : 'Employee'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback className="bg-red-600 text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-300">{user?.username}</span>
              <Button variant="outline" size="sm" onClick={logout} className="border-white/20 text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <Tabs defaultValue="search" className="space-y-6">
          <div className="space-y-2">
            {/* Updated circled highlighted tabs layout */}
            <TabsList className="grid w-full grid-cols-6 gap-3 bg-transparent p-1">
              <TabsTrigger 
                value="search" 
                className="rounded-full bg-white/10 hover:bg-white/20 data-[state=active]:bg-red-600 data-[state=active]:text-white text-white border border-white/20 py-3 px-6 font-medium transition-all"
              >
                Customer Management
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="rounded-full bg-white/10 hover:bg-white/20 data-[state=active]:bg-red-600 data-[state=active]:text-white text-white border border-white/20 py-3 px-6 font-medium transition-all"
              >
                Registration & QR
                {pendingCustomers.length > 0 && (
                  <Badge variant="destructive" className="ml-2 rounded-full">{pendingCustomers.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="rounded-full bg-white/10 hover:bg-white/20 data-[state=active]:bg-red-600 data-[state=active]:text-white text-white border border-white/20 py-3 px-6 font-medium transition-all"
              >
                Check-ins & Room Map
              </TabsTrigger>
              <TabsTrigger 
                value="cart" 
                className="rounded-full bg-white/10 hover:bg-white/20 data-[state=active]:bg-red-600 data-[state=active]:text-white text-white border border-white/20 py-3 px-6 font-medium transition-all"
              >
                Transactions & Reports
                {currentTransaction.items.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-full">{currentTransaction.items.length}</Badge>
                )}
              </TabsTrigger>
              {user?.role === 'manager' && (
                <TabsTrigger 
                  value="admin" 
                  className="rounded-full bg-white/10 hover:bg-white/20 data-[state=active]:bg-red-600 data-[state=active]:text-white text-white border border-white/20 py-3 px-6 font-medium transition-all"
                >
                  Admin
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Search className="h-5 w-5 mr-2" />
                  Customer Search
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Search by name or ID number, or add a new customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search by first name, last name, or ID number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button onClick={searchCustomers} disabled={loading} className="flex-button">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={() => {
                    console.log('Add New button clicked, setting showAddCustomer to true');
                    setShowAddCustomer(true);
                  }} className="flex-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                  <Button variant="outline" onClick={() => setShowIdScanner(true)} className="flex-button bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                    <Camera className="h-4 w-4 mr-2" />
                    Scan ID
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Transaction */}
            {showCurrentTransaction && currentTransaction.items.length > 0 && (
              <Card className="dashboard-card mb-6" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Current Transaction
                      {currentTransaction.customer && (
                        <span className="ml-2 text-blue-400">- {currentTransaction.customer.first_name} {currentTransaction.customer.last_name}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearCurrentTransaction}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {currentTransaction.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-white">{item.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">${item.amount.toFixed(2)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCurrentTransaction(index)}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Subtotal:</span>
                      <span className="text-white">${currentTransaction.subtotal.toFixed(2)}</span>
                    </div>
                    {currentTransaction.discount && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Discount ({currentTransaction.discount.name}):</span>
                        <span className="text-red-400">-${currentTransaction.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">${currentTransaction.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-4">
                    <Button 
                      onClick={finalizeCurrentTransaction}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Finalize Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {customers.length > 0 && (
              <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
                <CardHeader>
                  <CardTitle className="text-white">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 border border-white/20 rounded-lg hover:bg-white/5 cursor-pointer interactive-card"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback className="bg-red-600 text-white">
                              {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-white">
                              <button 
                                className="hover:text-blue-300 underline cursor-pointer text-left"
                                onClick={() => openCustomerProfile(customer)}
                              >
                                {customer.first_name} {customer.last_name}
                              </button>
                            </h3>
                            <p className="text-sm text-gray-300">ID: {customer.id_number}</p>
                            <p className="text-sm text-gray-300">DOB: {customer.date_of_birth}</p>
                            {customer.notes && (
                              <p className="text-sm text-blue-300 italic mt-1">
                                📝 {customer.notes.length > 50 ? customer.notes.substring(0, 50) + '...' : customer.notes}
                              </p>
                            )}
                            {customer.unpaid_overtime_amount > 0 && (
                              <p className="text-sm text-red-400 font-semibold">
                                ⏰ Unpaid Overtime: ${customer.unpaid_overtime_amount.toFixed(2)} ({customer.unpaid_overtime_hours.toFixed(1)}h)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {customer.is_banned && (
                            <Badge variant="destructive">Banned</Badge>
                          )}
                          {customer.unpaid_overtime_amount > 0 && (
                            <Button 
                              size="sm" 
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOvertimeCustomer(customer);
                                setShowOvertimePayment(true);
                              }}
                            >
                              Pay Overtime
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                              // Check membership status when opening check-in dialog
                              const membershipStatus = await checkCustomerMembershipStatus(customer.id);
                              setCustomerMembershipStatus(membershipStatus);
                              
                              // If customer has valid membership, automatically set it in the form
                              if (membershipStatus && membershipStatus.has_valid_membership) {
                                setCheckinForm(prev => ({
                                  ...prev,
                                  membership_type: '6_month' // Assuming valid membership is 6_month
                                }));
                              } else {
                                // Reset membership type if no valid membership
                                setCheckinForm(prev => ({
                                  ...prev,
                                  membership_type: ''
                                }));
                              }
                              
                              setShowCheckIn(true);
                            }}
                            disabled={customer.is_banned || customer.unpaid_overtime_amount > 0}
                            className="flex-button"
                          >
                            Check In
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            {/* QR Code Generation */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Key className="h-5 w-5 mr-2" />
                  Membership Form QR Code
                </CardTitle>
                <CardDescription className="text-gray-300">
                  QR code for customers to scan and fill out membership forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  {qrCodeUrl ? (
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <img src={qrCodeUrl} alt="Membership Form QR Code" className="w-80 h-auto" />
                    </div>
                  ) : (
                    <div className="p-8 text-gray-400">Loading QR code...</div>
                  )}
                  <div className="text-sm text-gray-300">
                    <p>Customers can scan this QR code to fill out their membership information.</p>
                    <p>Applications will appear below for review and approval.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Customer Approvals */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="h-5 w-5 mr-2" />
                  Pending Customer Approvals ({pendingCustomers.length})
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Review and approve new customer applications from QR code registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={fetchPendingCustomers} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Refresh Pending List
                  </Button>

                  {pendingCustomers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No pending customer applications</p>
                  ) : (
                    <div className="grid gap-4">
                      {pendingCustomers.map((customer) => (
                        <div key={customer.id} className="p-4 border border-yellow-500/50 rounded-lg bg-yellow-600/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarFallback className="bg-yellow-600 text-white">
                                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white">
                                  {customer.first_name} {customer.last_name}
                                </h3>
                                <div className="text-sm text-gray-300 space-y-1">
                                  <p>ID: {customer.id_number}</p>
                                  <p>DOB: {customer.date_of_birth}</p>
                                  <p>ID Exp: {customer.id_expiration_date}</p>
                                  <p>State: {customer.state_of_id}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  Applied: {new Date(customer.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  if (window.confirm(`Approve ${customer.first_name} ${customer.last_name}? Make sure you have verified their physical ID.`)) {
                                    approvePendingCustomer(customer.id);
                                  }
                                }}
                              >
                                ✓ Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (window.confirm(`Reject application for ${customer.first_name} ${customer.last_name}?`)) {
                                    rejectPendingCustomer(customer.id);
                                  }
                                }}
                              >
                                ✗ Reject
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-blue-600/20 rounded border border-blue-500/50">
                            <p className="text-blue-200 text-sm">
                              <strong>📋 Verification Required:</strong> Please verify the customer's physical ID matches the information above before approving.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {/* Active Check-ins */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Clock className="h-5 w-5 mr-2" />
                  Active Check-ins ({activeCheckins.length})
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Currently checked-in customers organized by accommodation type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeCheckins.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active check-ins</p>
                ) : (
                  <div className="space-y-6">
                    {/* Lockers */}
                    {activeCheckins.filter(checkin => checkin.room_type === 'locker').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-3">
                          LOCKERS ({activeCheckins.filter(checkin => checkin.room_type === 'locker').length})
                        </h3>
                        <div className="grid gap-4">
                          {activeCheckins.filter(checkin => checkin.room_type === 'locker').map((checkin) => (
                            <div
                              key={checkin.id}
                              className={`p-4 border rounded-lg ${checkin.is_overtime ? 'border-red-300 bg-red-900/20' : 'border-white/20 bg-white/5'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar>
                                    <AvatarFallback className="bg-blue-600 text-white">
                                      {checkin.customer?.first_name?.charAt(0)}{checkin.customer?.last_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-white">
                                      {checkin.customer?.first_name} {checkin.customer?.last_name}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                      <span className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        LOCKER #{checkin.room_number}
                                      </span>
                                      <span className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        ${checkin.total_amount}
                                      </span>
                                      <span>Session #{checkin.session_count}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className={`font-semibold ${checkin.is_overtime ? 'text-red-400' : 'text-green-400'}`}>
                                      {formatRemainingTime(checkin.remaining_hours)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Checked in: {new Date(checkin.check_in_time).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleRenewal(checkin.id, `${checkin.customer?.first_name} ${checkin.customer?.last_name}`, checkin.room_type)}
                                    >
                                      Renew
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() => {
                                        setSelectedCheckin(checkin);
                                        setShowUpgrade(true);
                                      }}
                                    >
                                      Upgrade
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                      onClick={() => addToAllWaitlists(checkin.id)}
                                    >
                                      + All Waitlists
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant={checkin.is_overtime ? "destructive" : "outline"}
                                      onClick={() => handleCheckOut(checkin.id)}
                                      className={checkin.is_overtime ? "" : "border-white/20 text-white hover:bg-white/10"}
                                    >
                                      Check Out
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Small Rooms */}
                    {activeCheckins.filter(checkin => checkin.room_type === 'small_room').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-green-400 mb-3">
                          REGULAR ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'small_room').length})
                        </h3>
                        <div className="grid gap-4">
                          {activeCheckins.filter(checkin => checkin.room_type === 'small_room').map((checkin) => (
                            <div
                              key={checkin.id}
                              className={`p-4 border rounded-lg ${checkin.is_overtime ? 'border-red-300 bg-red-900/20' : 'border-white/20 bg-white/5'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar>
                                    <AvatarFallback className="bg-green-600 text-white">
                                      {checkin.customer?.first_name?.charAt(0)}{checkin.customer?.last_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-white">
                                      {checkin.customer?.first_name} {checkin.customer?.last_name}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                      <span className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        SMALL ROOM #{checkin.room_number}
                                      </span>
                                      <span className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        ${checkin.total_amount}
                                      </span>
                                      <span>Session #{checkin.session_count}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className={`font-semibold ${checkin.is_overtime ? 'text-red-400' : 'text-green-400'}`}>
                                      {formatRemainingTime(checkin.remaining_hours)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Checked in: {new Date(checkin.check_in_time).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleRenewal(checkin.id, `${checkin.customer?.first_name} ${checkin.customer?.last_name}`, checkin.room_type)}
                                    >
                                      Renew
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() => {
                                        setSelectedCheckin(checkin);
                                        setShowUpgrade(true);
                                      }}
                                    >
                                      Upgrade
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                      onClick={() => addToAllWaitlists(checkin.id)}
                                    >
                                      + All Waitlists
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant={checkin.is_overtime ? "destructive" : "outline"}
                                      onClick={() => handleCheckOut(checkin.id)}
                                      className={checkin.is_overtime ? "" : "border-white/20 text-white hover:bg-white/10"}
                                    >
                                      Check Out
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regular Rooms */}
                    {activeCheckins.filter(checkin => checkin.room_type === 'regular_room').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-purple-400 mb-3">
                          VIDEO ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'regular_room').length})
                        </h3>
                        <div className="grid gap-4">
                          {activeCheckins.filter(checkin => checkin.room_type === 'regular_room').map((checkin) => (
                            <div
                              key={checkin.id}
                              className={`p-4 border rounded-lg ${checkin.is_overtime ? 'border-red-300 bg-red-900/20' : 'border-white/20 bg-white/5'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar>
                                    <AvatarFallback className="bg-purple-600 text-white">
                                      {checkin.customer?.first_name?.charAt(0)}{checkin.customer?.last_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-white">
                                      {checkin.customer?.first_name} {checkin.customer?.last_name}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                      <span className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        REGULAR ROOM #{checkin.room_number}
                                      </span>
                                      <span className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        ${checkin.total_amount}
                                      </span>
                                      <span>Session #{checkin.session_count}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className={`font-semibold ${checkin.is_overtime ? 'text-red-400' : 'text-green-400'}`}>
                                      {formatRemainingTime(checkin.remaining_hours)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Checked in: {new Date(checkin.check_in_time).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleRenewal(checkin.id, `${checkin.customer?.first_name} ${checkin.customer?.last_name}`, checkin.room_type)}
                                    >
                                      Renew
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() => {
                                        setSelectedCheckin(checkin);
                                        setShowUpgrade(true);
                                      }}
                                    >
                                      Upgrade
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                      onClick={() => addToAllWaitlists(checkin.id)}
                                    >
                                      + All Waitlists
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant={checkin.is_overtime ? "destructive" : "outline"}
                                      onClick={() => handleCheckOut(checkin.id)}
                                      className={checkin.is_overtime ? "" : "border-white/20 text-white hover:bg-white/10"}
                                    >
                                      Check Out
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deluxe Rooms */}
                    {activeCheckins.filter(checkin => checkin.room_type === 'deluxe_room').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                          LARGE VIDEO ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'deluxe_room').length})
                        </h3>
                        <div className="grid gap-4">
                          {activeCheckins.filter(checkin => checkin.room_type === 'deluxe_room').map((checkin) => (
                            <div
                              key={checkin.id}
                              className={`p-4 border rounded-lg ${checkin.is_overtime ? 'border-red-300 bg-red-900/20' : 'border-white/20 bg-white/5'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar>
                                    <AvatarFallback className="bg-yellow-600 text-white">
                                      {checkin.customer?.first_name?.charAt(0)}{checkin.customer?.last_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-white">
                                      {checkin.customer?.first_name} {checkin.customer?.last_name}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                      <span className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        DELUXE ROOM #{checkin.room_number}
                                      </span>
                                      <span className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        ${checkin.total_amount}
                                      </span>
                                      <span>Session #{checkin.session_count}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className={`font-semibold ${checkin.is_overtime ? 'text-red-400' : 'text-green-400'}`}>
                                      {formatRemainingTime(checkin.remaining_hours)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Checked in: {new Date(checkin.check_in_time).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleRenewal(checkin.id, `${checkin.customer?.first_name} ${checkin.customer?.last_name}`, checkin.room_type)}
                                    >
                                      Renew
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() => {
                                        setSelectedCheckin(checkin);
                                        setShowUpgrade(true);
                                      }}
                                    >
                                      Upgrade
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                      onClick={() => addToAllWaitlists(checkin.id)}
                                    >
                                      + All Waitlists
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant={checkin.is_overtime ? "destructive" : "outline"}
                                      onClick={() => handleCheckOut(checkin.id)}
                                      className={checkin.is_overtime ? "" : "border-white/20 text-white hover:bg-white/10"}
                                    >
                                      Check Out
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room Map - Combined with Active Check-ins */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <MapPin className="h-5 w-5 mr-2" />
                  Room & Locker Availability Map
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Real-time view of all rooms and lockers - Click occupied rooms to manage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-300">Occupied (click to manage)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-black border border-gray-400 rounded"></div>
                      <span className="text-gray-300">Employee Assigned</span>
                    </div>
                  </div>

                  <Button onClick={fetchRoomMap} className="flex-button mb-4">
                    Refresh Map
                  </Button>

                  {/* Lockers Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                      LOCKERS (40-153)
                    </h3>
                    <div className="grid grid-cols-12 gap-1">
                      {roomMap.lockers.map((locker) => (
                        <div
                          key={locker.number}
                          className={`relative p-2 text-xs text-center rounded border cursor-pointer transition-colors ${
                            locker.available 
                              ? 'bg-green-600 border-green-400 text-white hover:bg-green-700' 
                              : locker.employee_assigned
                              ? 'bg-black border-gray-400 text-gray-300 cursor-not-allowed'
                              : locker.is_overtime
                              ? 'bg-red-800 border-red-600 text-white hover:bg-red-900'
                              : 'bg-red-600 border-red-400 text-white hover:bg-red-700'
                          }`}
                          title={
                            locker.employee_assigned
                              ? `Assigned to employee: ${locker.employee_assigned}`
                              : locker.available 
                              ? 'Available' 
                              : `Occupied by: ${locker.customer}\nTime remaining: ${formatRemainingTime(locker.remaining_hours)}\nClick to manage`
                          }
                          onClick={() => !locker.employee_assigned && handleRoomClick(locker)}
                        >
                          <div>{locker.number}</div>
                          {locker.employee_assigned && (
                            <div className="text-xs mt-1">
                              Employee
                            </div>
                          )}
                          {!locker.available && !locker.employee_assigned && (
                            <div className="text-xs mt-1">
                              {formatRemainingTime(locker.remaining_hours)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rooms Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                      <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                      ROOMS
                    </h3>
                    
                    {/* Regular Rooms */}
                    <div className="mb-4">
                      <h4 className="text-lg text-green-400 mb-2">REGULAR ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'small_room').length})</h4>
                      <div className="grid grid-cols-9 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'small_room').map((room) => (
                          <div
                            key={room.number}
                            className={`relative p-3 text-sm text-center rounded border cursor-pointer transition-colors ${
                              room.available 
                                ? 'bg-green-600 border-green-400 text-white hover:bg-green-700' 
                                : room.is_overtime
                                ? 'bg-red-800 border-red-600 text-white hover:bg-red-900'
                                : 'bg-red-600 border-red-400 text-white hover:bg-red-700'
                            }`}
                            title={
                              room.available 
                                ? 'Available' 
                                : `Occupied by: ${room.customer}\nTime remaining: ${formatRemainingTime(room.remaining_hours)}\nClick to manage`
                            }
                            onClick={() => handleRoomClick(room)}
                          >
                            <div>{room.number}</div>
                            {!room.available && (
                              <div className="text-xs mt-1">
                                {formatRemainingTime(room.remaining_hours)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Video Rooms */}
                    <div className="mb-4">
                      <h4 className="text-lg text-blue-400 mb-2">VIDEO ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'regular_room').length})</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'regular_room').map((room) => (
                          <div
                            key={room.number}
                            className={`relative p-4 text-sm text-center rounded border cursor-pointer transition-colors ${
                              room.available 
                                ? 'bg-green-600 border-green-400 text-white hover:bg-green-700' 
                                : room.is_overtime
                                ? 'bg-red-800 border-red-600 text-white hover:bg-red-900'
                                : 'bg-red-600 border-red-400 text-white hover:bg-red-700'
                            }`}
                            title={
                              room.available 
                                ? 'Available' 
                                : `Occupied by: ${room.customer}\nTime remaining: ${formatRemainingTime(room.remaining_hours)}\nClick to manage`
                            }
                            onClick={() => handleRoomClick(room)}
                          >
                            <div>{room.number}</div>
                            <div className="text-xs">TV</div>
                            {!room.available && (
                              <div className="text-xs mt-1">
                                {formatRemainingTime(room.remaining_hours)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Large Video Rooms */}
                    <div>
                      <h4 className="text-lg text-purple-400 mb-2">LARGE VIDEO ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'deluxe_room').length})</h4>
                      <div className="grid grid-cols-8 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'deluxe_room').map((room) => (
                          <div
                            key={room.number}
                            className={`relative p-4 text-sm text-center rounded border cursor-pointer transition-colors ${
                              room.available 
                                ? 'bg-green-600 border-green-400 text-white hover:bg-green-700' 
                                : room.is_overtime
                                ? 'bg-red-800 border-red-600 text-white hover:bg-red-900'
                                : 'bg-red-600 border-red-400 text-white hover:bg-red-700'
                            }`}
                            title={
                              room.available 
                                ? 'Available' 
                                : `Occupied by: ${room.customer}\nTime remaining: ${formatRemainingTime(room.remaining_hours)}\nClick to manage`
                            }
                            onClick={() => handleRoomClick(room)}
                          >
                            <div>{room.number}</div>
                            <div className="text-xs">DELUXE TV</div>
                            {!room.available && (
                              <div className="text-xs mt-1">
                                {formatRemainingTime(room.remaining_hours)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Map merged into Admin & Room Map tab */}
          <TabsContent value="cart" className="space-y-6">
            {/* Current Cart/Transaction */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Cart & Transactions
                    {currentTransaction.customer && (
                      <span className="ml-2 text-blue-400">- {currentTransaction.customer.first_name} {currentTransaction.customer.last_name}</span>
                    )}
                  </div>
                  {currentTransaction.items.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearCurrentTransaction}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Cart
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Add memberships and additional items to cart, then process payment. View transaction history below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Customer Selection Section */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Customer (Optional for Additional Items)</h4>
                    {!currentTransaction.customer ? (
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            placeholder="Search for customer (optional)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          />
                          <Button onClick={searchCustomers} disabled={loading} className="flex-button">
                            <Search className="h-4 w-4 mr-2" />
                            Search
                          </Button>
                        </div>
                        
                        <div className="text-center p-4 bg-white/5 rounded-lg">
                          <p className="text-gray-400 text-sm">
                            Skip customer selection to sell additional items only, or search for a customer to add memberships
                          </p>
                        </div>
                        
                        {customers.length > 0 && (
                          <div className="max-h-60 overflow-y-auto">
                            <div className="space-y-2">
                              {customers.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10"
                                  onClick={() => {
                                    setCurrentTransaction(prev => ({
                                      ...prev,
                                      customer: customer
                                    }));
                                    setCustomers([]);
                                    setSearchQuery('');
                                  }}
                                >
                                  <div>
                                    <p className="text-white font-medium">{customer.first_name} {customer.last_name}</p>
                                    <p className="text-gray-400 text-sm">{customer.id_number}</p>
                                  </div>
                                  <Button size="sm" className="flex-button">
                                    Select
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold">{currentTransaction.customer.first_name} {currentTransaction.customer.last_name}</h3>
                          <p className="text-gray-400">{currentTransaction.customer.id_number}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentTransaction(prev => ({ ...prev, customer: null }))}
                          className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
                        >
                          Remove Customer
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Add Memberships - Only show if customer is selected */}
                  {currentTransaction.customer && (
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Add Membership</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white/5 border-white/20 cursor-pointer hover:bg-white/10" 
                              onClick={() => {
                                const membershipItem = {
                                  type: 'membership',
                                  name: '1 Day Membership',
                                  amount: 10,
                                  membership_type: '1_day'
                                };
                                addToCurrentTransaction(membershipItem);
                              }}>
                          <CardContent className="p-4 text-center">
                            <h5 className="text-white font-medium">1 Day Membership</h5>
                            <p className="text-green-400 text-xl font-bold">$10.00</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/5 border-white/20 cursor-pointer hover:bg-white/10"
                              onClick={() => {
                                const membershipItem = {
                                  type: 'membership',
                                  name: '6 Month Membership',
                                  amount: 25,
                                  membership_type: '6_month'
                                };
                                addToCurrentTransaction(membershipItem);
                              }}>
                          <CardContent className="p-4 text-center">
                            <h5 className="text-white font-medium">6 Month Membership</h5>
                            <p className="text-green-400 text-xl font-bold">$25.00</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Add Additional Items - Always available */}
                  {additionalItems.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Add Additional Items</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {additionalItems.map((item) => (
                          <Card key={item.id} className="bg-white/5 border-white/20 cursor-pointer hover:bg-white/10"
                                onClick={() => {
                                  const additionalItem = {
                                    type: 'additional_item',
                                    name: item.name,
                                    amount: item.price,
                                    id: item.id
                                  };
                                  addToCurrentTransaction(additionalItem);
                                }}>
                            <CardContent className="p-4 text-center">
                              <h5 className="text-white font-medium">{item.name}</h5>
                              <p className="text-green-400 text-lg font-bold">${item.price.toFixed(2)}</p>
                              <p className="text-gray-400 text-sm">{item.category}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cart Items */}
                  {currentTransaction.items.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Cart Items</h4>
                      <div className="space-y-2">
                        {currentTransaction.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <p className="text-white font-medium">{item.name}</p>
                              <p className="text-gray-400 text-sm">{item.type.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-green-400 font-bold">${item.amount.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCurrentTransaction(index)}
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cart Total */}
                      <div className="border-t border-white/20 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Subtotal:</span>
                          <span className="text-white font-bold">${currentTransaction.subtotal.toFixed(2)}</span>
                        </div>
                        {currentTransaction.discount && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-300">Discount ({currentTransaction.discount.name}):</span>
                            <span className="text-red-400 font-bold">-${currentTransaction.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-white font-bold">Total:</span>
                          <span className="text-green-400 font-bold">${currentTransaction.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-4">
                        <Button
                          onClick={finalizeCurrentTransaction}
                          className="flex-1 flex-button font-semibold py-3"
                          disabled={currentTransaction.items.length === 0}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Process Payment
                        </Button>
                        <Button
                          variant="outline"
                          onClick={clearCurrentTransaction}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          Clear Cart
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Transaction History
                  </div>
                  <Button
                    onClick={fetchTransactions}
                    size="sm"
                    className="flex-button"
                  >
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Recent transactions and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.role === 'manager' ? (
                  <div className="space-y-4">
                    {transactions.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No transactions found</p>
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-white font-medium">{transaction.customer_name}</h3>
                                <span className="text-green-400 font-bold">${transaction.total_amount.toFixed(2)}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Type</p>
                                  <p className="text-white">{transaction.transaction_type}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Payment</p>
                                  <p className="text-white">{transaction.payment_method}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Date</p>
                                  <p className="text-white">{new Date(transaction.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {user?.role === 'manager' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setRefundAmount(transaction.total_amount);
                                        setShowRefundDialog(true);
                                      }}
                                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                    >
                                      Refund
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Manager access required to view transaction history</p>
                )}
              </CardContent>
            </Card>

            {/* Sales Reports - Combined with Transactions */}
            <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <FileText className="h-5 w-5 mr-2" />
                  Sales Reports
                </CardTitle>
                <CardDescription className="text-gray-300">
                  View daily and monthly sales reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Button onClick={fetchSalesReport} className="flex-button">
                      Generate Report
                    </Button>
                  </div>

                  {salesData && (
                    <div className="bg-white/5 p-4 rounded">
                      <h4 className="font-semibold text-white mb-4">
                        {reportType === 'daily' ? 'Daily' : 'Monthly'} Sales Report - {selectedDate}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-300">Total Revenue:</p>
                          <p className="text-white font-semibold">${salesData.total_revenue?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-gray-300">Total Transactions:</p>
                          <p className="text-white font-semibold">{salesData.total_transactions || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-300">Check-ins:</p>
                          <p className="text-white font-semibold">{salesData.checkin_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-300">Additional Items:</p>
                          <p className="text-white font-semibold">{salesData.item_count || 0}</p>
                        </div>
                      </div>
                      
                      {salesData.breakdown && salesData.breakdown.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-white mb-2">Transaction Breakdown:</h5>
                          <div className="space-y-2">
                            {salesData.breakdown.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.type}:</span>
                                <span className="text-white">${item.amount?.toFixed(2) || '0.00'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Code tab merged into Registration & QR tab */}
          {/* Sales Reports merged into Transactions & Reports tab */}



          {user?.role === 'manager' && (
            <TabsContent value="admin" className="space-y-6">
              {/* Admin Settings */}
              <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Settings className="h-5 w-5 mr-2" />
                    Admin Settings
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage discounts, additional items, and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="discounts" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-5 bg-white/10">
                      <TabsTrigger value="discounts" className="tab-dark">Discounts</TabsTrigger>
                      <TabsTrigger value="items" className="tab-dark">Additional Items</TabsTrigger>
                      <TabsTrigger value="pricing" className="tab-dark">Pricing</TabsTrigger>
                      <TabsTrigger value="employees" className="tab-dark">Employees</TabsTrigger>
                      <TabsTrigger value="passwords" className="tab-dark">Passwords</TabsTrigger>
                    </TabsList>

                    <TabsContent value="discounts" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Discount Management</h3>
                        <Button onClick={() => setShowAddDiscount(true)} className="flex-button">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Discount
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {adminDiscounts.map((discount) => (
                          <div key={discount.id} className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5">
                            <div>
                              <h4 className="font-medium text-white">{discount.name}</h4>
                              <p className="text-sm text-gray-300">${discount.amount.toFixed(2)} off</p>
                              {discount.description && (
                                <p className="text-xs text-gray-400">{discount.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={discount.active ? "default" : "secondary"}>
                                {discount.active ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => {
                                  setEditingDiscount(discount);
                                  setShowEditDiscount(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => toggleDiscount(discount.id, discount.active)}
                              >
                                {discount.active ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteDiscount(discount.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="items" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Additional Items Management</h3>
                        <Button onClick={() => setShowAddItem(true)} className="flex-button">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {adminItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5">
                            <div>
                              <h4 className="font-medium text-white">{item.name}</h4>
                              <p className="text-sm text-gray-300">${item.price.toFixed(2)}</p>
                              <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={item.active ? "default" : "secondary"}>
                                {item.active ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowEditItem(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => toggleAdditionalItem(item.id, item.active)}
                              >
                                {item.active ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteAdditionalItem(item.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="passwords" className="space-y-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Password Management</h3>
                        
                        <Card className="bg-white/10 border-white/20">
                          <CardContent className="p-4">
                            <Button
                              onClick={() => {
                                setPasswordDialogType('change');
                                setShowPasswordDialog(true);
                              }}
                              className="flex-button w-full"
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Change My Password
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/10 border-white/20">
                          <CardHeader>
                            <h4 className="text-white">Reset Employee Passwords</h4>
                            <p className="text-gray-300 text-sm">Click on any employee to reset their password</p>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2">
                              {employees.filter(emp => emp.id !== user?.id).map((employee) => (
                                <Button
                                  key={employee.id}
                                  variant="outline"
                                  className="justify-start border-white/20 text-white hover:bg-white/10"
                                  onClick={() => {
                                    setPasswordForm({
                                      ...passwordForm,
                                      targetUserId: employee.id,
                                      targetUsername: employee.username
                                    });
                                    setPasswordDialogType('reset');
                                    setShowPasswordDialog(true);
                                  }}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Reset password for {employee.username}
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Pricing Management</h3>
                        <Button onClick={() => setShowPricingDialog(true)} className="flex-button">
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Pricing
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(30, 58, 138, 0.3)' }}>
                          <CardHeader>
                            <CardTitle className="text-white">Weekday Pricing</CardTitle>
                            <CardDescription className="text-gray-300">Monday 12am - Friday 4pm</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-white">
                              <span>Locker:</span>
                              <span>${pricingConfig.locker_weekday.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span>Small Room:</span>
                              <span>${pricingConfig.small_room_weekday.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span>Regular Room:</span>
                              <span>${pricingConfig.regular_room_weekday.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span>Deluxe Room:</span>
                              <span>${pricingConfig.deluxe_room_weekday.toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(30, 58, 138, 0.3)' }}>
                          <CardHeader>
                            <CardTitle className="text-white">Weekend Pricing</CardTitle>
                            <CardDescription className="text-gray-300">Friday 4pm - Monday 12am</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-white">
                              <span>Locker:</span>
                              <span>${pricingConfig.locker_weekend.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span>Small Room:</span>
                              <span>${pricingConfig.small_room_weekend.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span>Regular Room:</span>
                              <span>${pricingConfig.regular_room_weekend.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white">
                              <span>Deluxe Room:</span>
                              <span>${pricingConfig.deluxe_room_weekend.toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="employees" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Employee Management</h3>
                        <Button onClick={() => setShowAddEmployee(true)} className="flex-button">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Employee
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {employees.map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarFallback className="bg-red-600 text-white">
                                  {employee.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white">{employee.username}</h3>
                                <p className="text-sm text-gray-300 capitalize">{employee.role}</p>
                                {employee.assigned_locker_number && (
                                  <p className="text-sm text-green-400">
                                    Assigned Locker: #{employee.assigned_locker_number}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400">
                                  Created: {new Date(employee.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => {
                                  setPasswordForm({
                                    ...passwordForm,
                                    targetUserId: employee.id,
                                    targetUsername: employee.username
                                  });
                                  setPasswordDialogType('reset');
                                  setShowPasswordDialog(true);
                                }}
                              >
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                className={employee.assigned_locker_number ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                                onClick={() => {
                                  if (employee.assigned_locker_number) {
                                    // Unassign current locker
                                    if (window.confirm(`Unassign locker #${employee.assigned_locker_number} from ${employee.username}?`)) {
                                      unassignLockerFromEmployee(employee.id);
                                    }
                                  } else {
                                    // Assign new locker
                                    const roomNumber = window.prompt(`Assign a locker to ${employee.username}:\n\nEnter locker number (40-153):`);
                                    if (roomNumber && roomNumber >= 40 && roomNumber <= 153) {
                                      assignLockerToEmployee(employee.id, roomNumber);
                                    } else if (roomNumber) {
                                      alert('Invalid locker number. Please enter a number between 40-153.');
                                    }
                                  }
                                }}
                              >
                                {employee.assigned_locker_number ? 'Unassign Locker' : 'Assign Locker'}
                              </Button>
                              {employee.username !== 'admin' && employee.id !== user?.id && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteEmployee(employee.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Room Map Tab Removed */}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
        </Tabs>
      </div>

      {/* Overtime Payment Prompt Dialog */}
      {showOvertimePrompt && checkoutOvertimeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime Payment Required</h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Session Duration: <strong>{checkoutOvertimeData.sessionDuration.toFixed(1)} hours</strong>
              </p>
              <p className="text-gray-700">
                Overtime: <strong>{checkoutOvertimeData.overtimeHours} hours</strong>
              </p>
              <p className="text-red-600 font-semibold">
                Overtime Amount: <strong>${checkoutOvertimeData.overtimeAmount.toFixed(2)}</strong>
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleOvertimePayment(true)}
              >
                Pay Now
              </Button>
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => handleOvertimePayment(false)}
              >
                IOU (Pay Later)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Room Management Dialog */}
      {showRoomManagement && selectedRoomForManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manage {selectedRoomForManagement.room.type === 'locker' ? 'Locker' : 'Room'} #{selectedRoomForManagement.room.number}
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                <strong>Customer:</strong> {selectedRoomForManagement.room.customer}
              </p>
              <p className="text-gray-700">
                <strong>Time Remaining:</strong> {formatRemainingTime(selectedRoomForManagement.room.remaining_hours)}
              </p>
              {selectedRoomForManagement.room.is_overtime && (
                <p className="text-red-600 font-semibold">OVERTIME</p>
              )}
            </div>
            <div className="flex flex-col space-y-3">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleRenewal(selectedRoomForManagement.checkin.id, `${selectedRoomForManagement.checkin.customer?.first_name} ${selectedRoomForManagement.checkin.customer?.last_name}`, selectedRoomForManagement.checkin.room_type)}
              >
                Renew (Same Room/Locker - Base Rate)
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  // Upgrade - show upgrade options
                  setSelectedCheckin(selectedRoomForManagement.checkin);
                  setShowRoomManagement(false);
                  setShowUpgrade(true);
                }}
              >
                Upgrade (Move to Different Room/Locker)
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  // Check out
                  handleCheckOut(selectedRoomForManagement.checkin.id);
                  setShowRoomManagement(false);
                }}
              >
                Check Out
              </Button>
              <Button
                className="bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => setShowRoomManagement(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Management Dialog */}
      {showPricingDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Pricing</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Weekday Pricing</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Locker</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.locker_weekday}
                      onChange={(e) => setPricingConfig({...pricingConfig, locker_weekday: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Small Room</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.small_room_weekday}
                      onChange={(e) => setPricingConfig({...pricingConfig, small_room_weekday: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Regular Room</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.regular_room_weekday}
                      onChange={(e) => setPricingConfig({...pricingConfig, regular_room_weekday: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deluxe Room</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.deluxe_room_weekday}
                      onChange={(e) => setPricingConfig({...pricingConfig, deluxe_room_weekday: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Weekend Pricing</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Locker</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.locker_weekend}
                      onChange={(e) => setPricingConfig({...pricingConfig, locker_weekend: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Small Room</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.small_room_weekend}
                      onChange={(e) => setPricingConfig({...pricingConfig, small_room_weekend: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Regular Room</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.regular_room_weekend}
                      onChange={(e) => setPricingConfig({...pricingConfig, regular_room_weekend: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deluxe Room</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingConfig.deluxe_room_weekend}
                      onChange={(e) => setPricingConfig({...pricingConfig, deluxe_room_weekend: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <strong>Weekend Schedule:</strong> Friday 4pm - Monday 12am<br/>
                <strong>Weekday Schedule:</strong> Monday 12am - Friday 4pm
              </div>
              <div className="flex space-x-3">
                <Button
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                  onClick={() => setShowPricingDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={updatePricing}
                >
                  Save Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {showRefundDialog && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Refund</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium">Customer: {selectedTransaction.customer_name}</p>
                <p className="text-sm text-gray-600">Transaction Type: {selectedTransaction.transaction_type}</p>
                <p className="text-sm text-gray-600">Original Amount: ${selectedTransaction.total_amount.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Payment Method: {selectedTransaction.payment_method}</p>
                <p className="text-sm text-gray-600">Date: {new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedTransaction.total_amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Notes (Optional)</label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Reason for refund..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={processRefund} 
                  disabled={refundAmount <= 0 || refundAmount > selectedTransaction.total_amount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Process Refund
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRefundDialog(false);
                    setRefundAmount(0);
                    setRefundNotes('');
                    setSelectedTransaction(null);
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      {showAddCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '28rem',
            width: '100%',
            margin: '16px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Customer</h3>
            <form onSubmit={addCustomer} className="space-y-4">
              <Input
                placeholder="First Name"
                value={customerForm.first_name}
                onChange={(e) => setCustomerForm({...customerForm, first_name: e.target.value})}
                required
              />
              <Input
                placeholder="Last Name"
                value={customerForm.last_name}
                onChange={(e) => setCustomerForm({...customerForm, last_name: e.target.value})}
                required
              />
              <Input
                placeholder="ID Number"
                value={customerForm.id_number}
                onChange={(e) => setCustomerForm({...customerForm, id_number: e.target.value})}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <Input
                  type="date"
                  placeholder="Date of Birth"
                  value={customerForm.date_of_birth}
                  onChange={(e) => setCustomerForm({...customerForm, date_of_birth: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Expiration Date</label>
                <Input
                  type="date"
                  placeholder="ID Expiration Date"
                  value={customerForm.id_expiration_date}
                  onChange={(e) => setCustomerForm({...customerForm, id_expiration_date: e.target.value})}
                  required
                />
              </div>
              <Input
                placeholder="State of ID"
                value={customerForm.state_of_id}
                onChange={(e) => setCustomerForm({...customerForm, state_of_id: e.target.value})}
                required
              />
              <div className="flex space-x-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding...' : 'Add Customer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  console.log('Cancel button clicked, setting showAddCustomer to false');
                  setShowAddCustomer(false);
                }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ID Scanner Dialog */}
      {showIdScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Driver's License</h3>
            <p className="text-gray-600 mb-6">
              Scan a customer's driver's license to automatically fill in their information
            </p>
            
            <div className="space-y-4">
              {/* File Upload Option */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-4">Choose an option to scan the ID:</p>
                  
                  {/* Camera Capture Button */}
                  <button
                    type="button"
                    onClick={handleIdScanFromCamera}
                    disabled={idScanLoading}
                    className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
                  >
                    📷 Use Camera
                  </button>
                  
                  {/* File Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        scanIdWithFile(file);
                      }
                    }}
                    disabled={idScanLoading}
                    className="hidden"
                    id="id-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('id-file-input').click()}
                    disabled={idScanLoading}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
                  >
                    📁 Upload Image
                  </button>
                </div>
                
                {idScanLoading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Scanning ID...</span>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Tips for best results:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure good lighting with no shadows or glare</li>
                  <li>• Keep the license flat and fully visible</li>
                  <li>• Take photo straight-on (not at an angle)</li>
                  <li>• Make sure all text is clearly readable</li>
                </ul>
              </div>
            </div>
            
            {/* Modal Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowIdScanner(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIdScanner(false);
                  setShowAddCustomer(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Skip & Add Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Dialog */}
      {showCheckIn && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Check In: {selectedCustomer.first_name} {selectedCustomer.last_name}
            </h3>
            
            {/* Show membership status if available */}
            {customerMembershipStatus && (
              <div className={`mb-4 p-3 rounded-lg ${customerMembershipStatus.has_valid_membership ? 'bg-green-100 border border-green-300' : 'bg-yellow-100 border border-yellow-300'}`}>
                <p className={`text-sm font-medium ${customerMembershipStatus.has_valid_membership ? 'text-green-800' : 'text-yellow-800'}`}>
                  {customerMembershipStatus.has_valid_membership 
                    ? `✅ Valid 6-month membership (${customerMembershipStatus.days_remaining} days remaining)`
                    : '⚠️ No valid membership - purchase required'
                  }
                </p>
              </div>
            )}
            
            <form onSubmit={handleCheckIn} className="space-y-4">
              {/* Only show membership selection if customer doesn't have valid membership */}
              {(!customerMembershipStatus || !customerMembershipStatus.has_valid_membership) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                  <Select onValueChange={(value) => setCheckinForm({...checkinForm, membership_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select membership type" />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 10000 }}>
                      <SelectItem value="1_day">1 Day ($10)</SelectItem>
                      <SelectItem value="6_month">6 Month ($25)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Type</label>
                <Select onValueChange={(value) => {
                  setCheckinForm({...checkinForm, accommodation_type: value, room_type: value});
                  if (value) fetchAvailableRooms(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accommodation" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 10000 }}>
                    <SelectItem value="locker">Locker</SelectItem>
                    <SelectItem value="small_room">Small Room (No TV)</SelectItem>
                    <SelectItem value="regular_room">Regular Room (With TV)</SelectItem>
                    <SelectItem value="deluxe_room">Deluxe Room (With TV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {availableRooms.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Rooms/Lockers</label>
                  <Select onValueChange={(value) => setCheckinForm({...checkinForm, room_number: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room/locker number" />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 10000 }}>
                      {roomDetails.map((room) => (
                        <SelectItem key={room.number} value={room.number.toString()}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex space-x-3">
                <Button type="submit" disabled={loading || !checkinForm.room_number} className="flex-1">
                  {loading ? 'Checking In...' : 'Check In'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCheckIn(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {paymentData.transactionType === 'renewal' ? 'Renewal Payment' : 
               paymentData.transactionType === 'membership' ? 'Membership Purchase' :
               paymentData.transactionType === 'standalone' ? 'Transaction Payment' : 'Payment Processing'}
            </h3>
            
            <div className="space-y-4">
              {/* Customer and Base Transaction Info */}
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium">Customer: {paymentData.customerName}</p>
                {paymentData.transactionType === 'renewal' && (
                  <p className="text-sm text-gray-600">Session Renewal - Restarts 8-hour timer</p>
                )}
                {paymentData.transactionType === 'membership' && (
                  <p className="text-sm text-gray-600">Membership: {paymentData.membershipType}</p>
                )}
              </div>

              {/* Additional Items Section */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Additional Items</h4>
                  <Select onValueChange={(value) => {
                    const item = additionalItems.find(item => item.id === value);
                    if (item) {
                      setPaymentData(prev => ({
                        ...prev,
                        additionalItems: [...prev.additionalItems, { name: item.name, price: item.price, id: item.id }],
                        totalAmount: prev.totalAmount + item.price
                      }));
                    }
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Add Item" />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 10000 }}>
                      {additionalItems.filter(item => item.active).map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - ${item.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  {paymentData.additionalItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                      <span>{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPaymentData(prev => ({
                              ...prev,
                              additionalItems: prev.additionalItems.filter((_, i) => i !== index),
                              totalAmount: prev.totalAmount - item.price
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {paymentData.additionalItems.length === 0 && (
                    <p className="text-gray-500 text-sm">No additional items</p>
                  )}
                </div>
              </div>

              {/* Discounts Section */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Discount</h4>
                  <Select onValueChange={(value) => {
                    if (value === 'none') {
                      // Remove discount
                      setPaymentData(prev => ({
                        ...prev,
                        selectedDiscount: null,
                        discountAmount: 0,
                        totalAmount: prev.totalAmount + (prev.selectedDiscount?.amount || 0)
                      }));
                    } else {
                      const discount = discounts.find(d => d.id === value);
                      if (discount) {
                        setPaymentData(prev => ({
                          ...prev,
                          selectedDiscount: discount,
                          discountAmount: discount.amount,
                          totalAmount: Math.max(0, prev.totalAmount - discount.amount + (prev.selectedDiscount?.amount || 0))
                        }));
                      }
                    }
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Discount" />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 10000 }}>
                      <SelectItem value="none">No Discount</SelectItem>
                      {discounts.filter(d => d.active).map((discount) => (
                        <SelectItem key={discount.id} value={discount.id}>
                          {discount.name} - ${discount.amount.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {paymentData.selectedDiscount ? (
                  <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                    <span>{paymentData.selectedDiscount.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-green-600">-${paymentData.discountAmount.toFixed(2)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPaymentData(prev => ({
                            ...prev,
                            selectedDiscount: null,
                            discountAmount: 0,
                            totalAmount: prev.totalAmount + prev.discountAmount
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No discount applied</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <Select onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 10000 }}>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-blue-50 rounded border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Final Total:</span>
                  <span className="text-2xl font-bold text-green-600">${paymentData.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button 
                  onClick={handlePaymentComplete} 
                  disabled={!paymentData.paymentMethod}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete Payment
                </Button>
                <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Upgrade Dialog */}
      {showUpgrade && selectedCheckin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Upgrade</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p>Customer: {selectedCheckin.customer?.first_name} {selectedCheckin.customer?.last_name}</p>
                <p>Current: {selectedCheckin.room_type.replace('_', ' ').toUpperCase()} #{selectedCheckin.room_number}</p>
              </div>

              <form onSubmit={performRoomUpgrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Room Type</label>
                  <Select onValueChange={(value) => {
                    setUpgradeData({...upgradeData, new_room_type: value});
                    fetchAvailableRooms(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new room type" />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 10000 }}>
                      <SelectItem value="small_room">Small Room (No TV)</SelectItem>
                      <SelectItem value="regular_room">Regular Room (With TV)</SelectItem>
                      <SelectItem value="deluxe_room">Deluxe Room (With TV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {availableRooms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Rooms</label>
                    <Select onValueChange={(value) => setUpgradeData({...upgradeData, new_room_number: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room number" />
                      </SelectTrigger>
                      <SelectContent style={{ zIndex: 10000 }}>
                        {roomDetails.map((room) => (
                          <SelectItem key={room.number} value={room.number.toString()}>
                            {room.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button type="submit" disabled={loading || !upgradeData.new_room_number} className="flex-1">
                    {loading ? 'Upgrading...' : 'Upgrade Room'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpgrade(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Dialog */}
      {showProfile && selectedCustomerProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Profile: {selectedCustomerProfile.customer.first_name} {selectedCustomerProfile.customer.last_name}
              </h3>
              <Button variant="ghost" onClick={() => setShowProfile(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Number</label>
                  <p className="text-gray-900">{selectedCustomerProfile.customer.id_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">{selectedCustomerProfile.customer.date_of_birth}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Expiration</label>
                  <p className="text-gray-900">{selectedCustomerProfile.customer.id_expiration_date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State of ID</label>
                  <p className="text-gray-900">{selectedCustomerProfile.customer.state_of_id}</p>
                </div>
              </div>

              {/* Membership Status */}
              {selectedCustomerProfile.membership_expiration && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Membership Status</h4>
                  <p className="text-blue-700">
                    Expires: {new Date(selectedCustomerProfile.membership_expiration).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={4}
                  value={profileNotes}
                  onChange={(e) => setProfileNotes(e.target.value)}
                  placeholder="Add notes about this customer..."
                />
                <Button onClick={saveProfileNotes} className="mt-2">
                  Save Notes
                </Button>
              </div>

              {/* Visit History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Visits ({selectedCustomerProfile.total_visits})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCustomerProfile.visit_history.map((visit, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {visit.room_type.replace('_', ' ').toUpperCase()} #{visit.room_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(visit.date).toLocaleDateString()} at {new Date(visit.date).toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Membership: {visit.membership_type.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">${visit.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Payment Dialog */}
      {showOvertimePayment && overtimeCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Overtime Fees</h3>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded">
                <p className="font-medium">Customer: {overtimeCustomer.first_name} {overtimeCustomer.last_name}</p>
                <p className="text-lg font-bold text-red-600">
                  Amount Due: ${overtimeCustomer.unpaid_overtime_amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Overtime Hours: {overtimeCustomer.unpaid_overtime_hours.toFixed(1)}h
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <Select value={overtimePaymentMethod} onValueChange={setOvertimePaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 10000 }}>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={() => payOvertimeFees(overtimeCustomer.id, overtimePaymentMethod)}
                  className="flex-1"
                >
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => setShowOvertimePayment(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Dialog */}
      {showAddEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '28rem',
            width: '100%',
            margin: '16px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Employee</h3>
            <form onSubmit={addEmployee} className="space-y-4">
              <Input
                placeholder="Username"
                value={newEmployee.username}
                onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                required
              />
              <Select value={newEmployee.role} onValueChange={(value) => setNewEmployee({...newEmployee, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 10000 }}>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex space-x-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding...' : 'Add Employee'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddEmployee(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Discount Dialog */}
      {showAddDiscount && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '28rem',
            width: '100%',
            margin: '16px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Discount</h3>
            <form onSubmit={createDiscount} className="space-y-4">
              <Input
                placeholder="Discount Name"
                value={newDiscount.name}
                onChange={(e) => setNewDiscount({...newDiscount, name: e.target.value})}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Discount Amount ($)"
                value={newDiscount.amount}
                onChange={(e) => setNewDiscount({...newDiscount, amount: e.target.value})}
                required
              />
              <Input
                placeholder="Description (optional)"
                value={newDiscount.description}
                onChange={(e) => setNewDiscount({...newDiscount, description: e.target.value})}
              />
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  Add Discount
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDiscount(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Additional Item Dialog */}
      {showAddItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '28rem',
            width: '100%',
            margin: '16px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Additional Item</h3>
            <form onSubmit={createAdditionalItem} className="space-y-4">
              <Input
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                required
              />
              <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 10000 }}>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="fees">Fees</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  Add Item
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddItem(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Override Dialog for Waitlist Queue Enforcement */}
      {showManagerOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">🚫 Waitlist Queue Enforcement</h3>
            
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Waitlist Conflict Detected:</strong>
              </p>
              <p className="text-sm text-red-600 font-medium">
                {waitlistConflictMessage}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Only managers can override the waitlist queue. Enter your manager password to proceed:
              </p>
              
              <Input
                type="password"
                placeholder="Manager Password"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                className="w-full"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleManagerOverride()}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleManagerOverride}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading || !managerPassword.trim()}
              >
                {loading ? 'Verifying...' : 'Override Waitlist'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={cancelManagerOverride}
                className="flex-1"
                disabled={loading}
              >
                Follow Waitlist Queue
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              Staff must follow the waitlist order unless overridden by a manager
            </div>
          </div>
        </div>
      )}

      {/* Password Management Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {passwordDialogType === 'change' ? 'Change My Password' : `Reset Password for ${passwordForm.targetUsername}`}
            </h3>
            <form onSubmit={changePassword} className="space-y-4">
              {passwordDialogType === 'change' && (
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                />
              )}
              <Input
                type="password"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
              />
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  {passwordDialogType === 'change' ? 'Change Password' : 'Reset Password'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Discount Dialog */}
      {showEditDiscount && editingDiscount && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '28rem',
            width: '100%',
            margin: '16px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Discount</h3>
            <form onSubmit={updateDiscount} className="space-y-4">
              <Input
                placeholder="Discount Name"
                value={editingDiscount.name}
                onChange={(e) => setEditingDiscount({...editingDiscount, name: e.target.value})}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Amount ($)"
                value={editingDiscount.amount}
                onChange={(e) => setEditingDiscount({...editingDiscount, amount: e.target.value})}
                required
              />
              <Input
                placeholder="Description (optional)"
                value={editingDiscount.description || ''}
                onChange={(e) => setEditingDiscount({...editingDiscount, description: e.target.value})}
              />
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  Update Discount
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditDiscount(false);
                  setEditingDiscount(null);
                }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Additional Item Dialog */}
      {showEditItem && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '28rem',
            width: '100%',
            margin: '16px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Additional Item</h3>
            <form onSubmit={updateAdditionalItem} className="space-y-4">
              <Input
                placeholder="Item Name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={editingItem.price}
                onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                required
              />
              <Select value={editingItem.category} onValueChange={(value) => setEditingItem({...editingItem, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 10000 }}>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="fees">Fees</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  Update Item
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditItem(false);
                  setEditingItem(null);
                }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Login Component
function LoginPage({ locationId, locationName }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Location-specific logos mapping
  const locationLogos = {
    'los-angeles': 'https://customer-assets.emergentagent.com/job_flexspa-manager-1/artifacts/z4tmcwyp_1.jpg',
    'cleveland': 'https://customer-assets.emergentagent.com/job_flexspa-manager-1/artifacts/l0vjhp0o_3.jpg', 
    'atlanta': 'https://customer-assets.emergentagent.com/job_flexspa-manager-1/artifacts/5drj9tuf_5.jpg',
    'phoenix': 'https://customer-assets.emergentagent.com/job_flexspa-manager-1/artifacts/sleog7a8_7.jpg'
  };

  const currentLogo = locationLogos[locationId] || locationLogos['los-angeles'];

  // Check authentication on component mount and redirect if authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 LoginPage: Checking authentication on mount');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userData);
    
    if (token && userData) {
      console.log('✅ LoginPage: Authentication found, reloading page');
      // If already authenticated, just reload the page to show main dashboard
      // The parent component will handle the authenticated state
      window.location.reload();
    } else {
      console.log('❌ LoginPage: No authentication found, showing login form');
    }
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add location context if available
      const currentLocation = localStorage.getItem('currentLocation');
      if (currentLocation) {
        headers['X-Location'] = currentLocation;
      }
      
      const response = await axios.post(`${API}/api/login`, loginForm, { headers });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Force a page refresh by navigating to the same location
      // This ensures the App component re-initializes with the new authentication state
      window.location.href = window.location.pathname;
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials. Please check your username and password.');
    }
    
    setLoading(false);
  };

  // Single return statement - only show login form
  // After successful authentication, the page will reload and parent App will handle the authenticated state
  return (
        <div className="bg-black min-h-screen">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src={currentLogo} 
              alt={`${locationName || 'FLEX SPA'} Logo`}
              className="h-24 w-auto mx-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {locationName ? `${locationName.toUpperCase()} - STAFF PORTAL` : 'STAFF PORTAL'}
          </h2>
          <p className="text-gray-300">Sign in to access the spa management system</p>
        </div>
        
        <Card className="bg-gray-900 border border-red-500">
          <CardContent className="p-6">
            <form onSubmit={login} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                  className="w-full bg-black border border-gray-600 text-white placeholder:text-gray-400 focus:border-red-500"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                  className="w-full bg-black border border-gray-600 text-white placeholder:text-gray-400 focus:border-red-500"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            {/* Removed preset passwords as requested */}
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-red-500 hover:text-red-400 text-sm">
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
};

// Admin Login Page Component
const AdminLoginPage = () => {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      // Check if user is super admin
      if (parsedUser.role === 'super_admin' || parsedUser.can_see_all_locations) {
        setIsAuthenticated(true);
        setUser(parsedUser);
      }
    }
  }, []);

  // Admin login function
  const adminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = { 'Content-Type': 'application/json', 'X-Location': 'los-angeles' };
      const response = await axios.post(`${API}/api/login`, loginForm, { headers });
      const { access_token, user: userData } = response.data;
      
      // Check if user has admin privileges
      if (userData.role === 'super_admin' || userData.can_see_all_locations) {
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setIsAuthenticated(true);
        setUser(userData);
        
        // Redirect to super admin dashboard
        window.location.href = '/super-admin';
      } else {
        alert('Access denied. Super admin privileges required.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      alert('Invalid admin credentials.');
    }
    
    setLoading(false);
  };

  // If already authenticated, redirect to super admin
  if (isAuthenticated) {
    window.location.href = '/super-admin';
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
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
            SUPER ADMIN LOGIN
          </h2>
          <p className="text-gray-300 text-base font-medium tracking-wide">Access administrative dashboard</p>
        </div>
      </header>

      {/* Admin Login Form */}
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
            <p className="text-gray-300 text-lg font-medium">Super admin credentials required</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Admin Username"
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
                placeholder="Admin Password"
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
              onClick={adminLogin}
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
              {loading ? 'SIGNING IN...' : 'ACCESS DASHBOARD'}
            </button>
          </div>
          
          {/* Removed preset passwords as requested */}
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-red-500 hover:text-red-400 text-sm">
              ← Back to Main Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Location-aware admin app - this renders the MAIN App with location context
const LocationAdminApp = ({ locationId }) => {
  useEffect(() => {
    if (locationId) {
      // Set location context for API calls
      localStorage.setItem('currentLocation', locationId);
    }
  }, [locationId]);

  // Simply render the main App component with location context
  // The App component will handle authentication and show login form if needed
  return <App locationId={locationId} />;
};

// Main App Router with multi-location support
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin login page */}
        <Route path="/admin-login" element={<AdminLoginPage />} />
        
        {/* Super admin dashboard */}
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        
        {/* Location-specific LOGIN pages - direct from main site */}
        <Route path="/los-angeles" element={<LocationAdminApp locationId="los-angeles" />} />
        <Route path="/atlanta" element={<LocationAdminApp locationId="atlanta" />} />
        <Route path="/cleveland" element={<LocationAdminApp locationId="cleveland" />} />
        <Route path="/phoenix" element={<LocationAdminApp locationId="phoenix" />} />
        
        {/* QR code membership forms for each location */}
        <Route path="/los-angeles/membership" element={<MembershipForm />} />
        <Route path="/atlanta/membership" element={<MembershipForm />} />
        <Route path="/cleveland/membership" element={<MembershipForm />} />
        <Route path="/phoenix/membership" element={<MembershipForm />} />
        
        {/* Legacy route redirect */}
        <Route path="/membership" element={<MembershipForm />} />
        
        {/* Catch all - redirect to landing page */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}