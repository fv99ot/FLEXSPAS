import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode';
import './App.css';
import MembershipForm from './MembershipForm';

// Import shadcn components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { Textarea } from './components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Search, Plus, LogOut, Users, Clock, DollarSign, AlertTriangle, User, MapPin, Calendar, BarChart3 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://flexla-admin.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      // Navigate to dashboard on successful login
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="login-card shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-white mb-2 flex-brand">
              Flex Spa <span className="flex-accent">Los Angeles</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Bathhouse Management System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              {error && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit" 
                className="w-full flex-button font-semibold py-3"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 text-center text-gray-400 text-sm">
          Default admin: username: admin, password: admin123
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeCheckins, setActiveCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salesReport, setSalesReport] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    username: '',
    password: '',
    role: 'employee'
  });
  const [roomMap, setRoomMap] = useState({
    lockers: [],
    rooms: []
  });
  const [additionalItems, setAdditionalItems] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    category: 'general'
  });
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [upgradeForm, setUpgradeForm] = useState({
    new_room_type: '',
    new_room_number: ''
  });
  const [secretCodeActive, setSecretCodeActive] = useState(false);
  
  // Admin settings state
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    amount: '',
    description: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [adminDiscounts, setAdminDiscounts] = useState([]);
  const [adminItems, setAdminItems] = useState([]);

  // Customer form data
  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    id_expiration_date: '',
    state_of_id: ''
  });

  // Check-in form data
  const [checkinForm, setCheckinForm] = useState({
    membership_type: '',
    accommodation_type: '', // 'locker' or 'room'
    room_type: '',
    room_number: ''
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomDetails, setRoomDetails] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentData, setPaymentData] = useState({
    checkInId: '',
    customerName: '',
    totalAmount: 0,
    paymentMethod: '',
    additionalItems: []
  });

  useEffect(() => {
    fetchActiveCheckins();
    generateQRCode();
    fetchPendingCustomers(); // All staff can see pending customers
    if (user?.role === 'manager') {
      fetchEmployees();
      fetchAdditionalItems();
      fetchAdminDiscounts();
      fetchAdminItems();
    }
  }, [user]);

  // Secret code listener for shift+1+0 combination
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.shiftKey && event.key === '1') {
        // User pressed shift+1, listen for 0
        const handleNext = (nextEvent) => {
          if (nextEvent.key === '0') {
            // Secret code activated: shift+1+0 = "!)"
            applySecretDiscount("!)").then(discount => {
              if (discount) {
                alert('Ghost discount activated! 🙈');
              }
            });
          }
          document.removeEventListener('keydown', handleNext);
        };
        document.addEventListener('keydown', handleNext);
        
        // Remove listener after 2 seconds if no follow-up
        setTimeout(() => {
          document.removeEventListener('keydown', handleNext);
        }, 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const generateQRCode = async () => {
    try {
      const membershipUrl = `${window.location.origin}/membership`;
      const qrDataUrl = await QRCode.toDataURL(membershipUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const searchCustomers = async () => {
    if (!searchQuery.trim()) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/customers?q=${encodeURIComponent(searchQuery)}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
    setLoading(false);
  };

  const fetchActiveCheckins = async () => {
    try {
      const response = await axios.get(`${API}/checkins/active`);
      setActiveCheckins(response.data);
    } catch (error) {
      console.error('Error fetching active check-ins:', error);
    }
  };

  const fetchSalesReport = async (date = reportDate) => {
    try {
      const response = await axios.get(`${API}/reports/daily-sales?date=${date}`);
      setSalesReport(response.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/users`, employeeForm);
      setEmployeeForm({
        username: '',
        password: '',
        role: 'employee'
      });
      setShowAddEmployee(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(error.response?.data?.detail || 'Error adding employee');
    }
    setLoading(false);
  };

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get(`${API}/discounts`);
      setDiscounts(response.data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const fetchWaitlist = async () => {
    try {
      const response = await axios.get(`${API}/waitlist`);
      setWaitlist(response.data);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  const addToWaitlist = async (customerId, roomType, membershipType) => {
    try {
      await axios.post(`${API}/waitlist`, {
        customer_id: customerId,
        room_type: roomType,
        membership_type: membershipType
      });
      fetchWaitlist();
      alert('Customer added to waitlist successfully!');
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert('Error adding to waitlist');
    }
  };

  const upgradeRoom = async (checkinId, newRoomType, newRoomNumber) => {
    try {
      const response = await axios.post(`${API}/checkin/${checkinId}/upgrade`, {
        new_room_type: newRoomType,
        new_room_number: newRoomNumber
      });
      fetchActiveCheckins();
      return response.data;
    } catch (error) {
      console.error('Error upgrading room:', error);
      throw error;
    }
  };

  // Secret code detection
  const handleKeyDown = (e) => {
    if (e.shiftKey && e.key === '!' && e.code === 'Digit1') {
      // Shift + 1 + 0 sequence - we'll check for Shift + ! (which is Shift + 1)
      setTimeout(() => {
        if (e.shiftKey && e.key === ')') { // Shift + 0 is ')'
          setSecretCodeActive(true);
          console.log('🤫 Secret code activated - Ghost discount available');
        }
      }, 100);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchPendingCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/pending-customers`, { headers });
      setPendingCustomers(response.data);
    } catch (error) {
      console.error('Error fetching pending customers:', error);
    }
  };

  const approvePendingCustomer = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post(`${API}/pending-customers/${customerId}/approve`, {}, { headers });
      fetchPendingCustomers(); // Refresh pending list
      alert('Customer approved successfully!');
    } catch (error) {
      console.error('Error approving customer:', error);
      alert(error.response?.data?.detail || 'Error approving customer');
    }
  };

  const rejectPendingCustomer = async (customerId) => {
    try {
      await axios.delete(`${API}/pending-customers/${customerId}`);
      fetchPendingCustomers(); // Refresh pending list
      alert('Customer application rejected.');
    } catch (error) {
      console.error('Error rejecting customer:', error);
      alert('Error rejecting customer');
    }
  };

  const fetchAdditionalItems = async () => {
    try {
      const response = await axios.get(`${API}/additional-items`);
      setAdditionalItems(response.data);
    } catch (error) {
      console.error('Error fetching additional items:', error);
    }
  };

  const addAdditionalItem = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/additional-items`, {
        name: itemForm.name,
        price: parseFloat(itemForm.price),
        category: itemForm.category
      });
      setItemForm({ name: '', price: '', category: 'general' });
      setShowAddItem(false);
      fetchAdditionalItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert(error.response?.data?.detail || 'Error adding item');
    }
    setLoading(false);
  };

  const deleteAdditionalItem = async (itemId) => {
    try {
      await axios.delete(`${API}/additional-items/${itemId}`);
      fetchAdditionalItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  // Admin Settings Functions
  const fetchAdminDiscounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/admin/discounts`, { headers });
      setAdminDiscounts(response.data);
    } catch (error) {
      console.error('Error fetching admin discounts:', error);
    }
  };

  const fetchAdminItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/admin/additional-items`, { headers });
      setAdminItems(response.data);
    } catch (error) {
      console.error('Error fetching admin items:', error);
    }
  };

  const addDiscount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.post(`${API}/discounts`, {
        name: discountForm.name,
        amount: parseFloat(discountForm.amount),
        description: discountForm.description
      }, { headers });
      
      setDiscountForm({ name: '', amount: '', description: '' });
      setShowAddDiscount(false);
      fetchAdminDiscounts();
      alert('Discount created successfully!');
    } catch (error) {
      console.error('Error adding discount:', error);
      alert(error.response?.data?.detail || 'Error adding discount');
    }
    setLoading(false);
  };

  const toggleDiscount = async (discountId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/discounts/${discountId}/toggle`, {}, { headers });
      fetchAdminDiscounts();
      alert('Discount status updated!');
    } catch (error) {
      console.error('Error toggling discount:', error);
      alert('Error updating discount');
    }
  };

  const deleteDiscount = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        await axios.delete(`${API}/discounts/${discountId}`, { headers });
        fetchAdminDiscounts();
        alert('Discount deleted successfully!');
      } catch (error) {
        console.error('Error deleting discount:', error);
        alert('Error deleting discount');
      }
    }
  };

  const updateAdminItem = async (itemId, itemData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/additional-items/${itemId}`, itemData, { headers });
      fetchAdminItems();
      setEditingItem(null);
      alert('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const toggleAdminItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.put(`${API}/additional-items/${itemId}/toggle`, {}, { headers });
      fetchAdminItems();
      alert('Item status updated!');
    } catch (error) {
      console.error('Error toggling item:', error);
      alert('Error updating item status');
    }
  };

  const seedDefaultItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post(`${API}/admin/seed-default-items`, {}, { headers });
      fetchAdminItems();
      alert(response.data.message);
    } catch (error) {
      console.error('Error seeding items:', error);
      alert('Error seeding default items');
    }
  };

  const applySecretDiscount = async (secretCode) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post(`${API}/apply-secret-discount`, { code: secretCode }, { headers });
      setSecretCodeActive(true);
      return response.data;
    } catch (error) {
      console.error('Error applying secret discount:', error);
      return null;
    }
  };

  // Waitlist Functions
  const fetchWaitlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/waitlist`, { headers });
      setWaitlist(response.data);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  const addToWaitlist = async (customerId, roomType, membershipType) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.post(`${API}/waitlist`, {
        customer_id: customerId,
        room_type: roomType || null,
        membership_type: membershipType
      }, { headers });
      fetchWaitlist();
      alert('Customer added to waitlist!');
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert('Error adding customer to waitlist');
    }
  };

  const removeFromWaitlist = async (entryId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/waitlist/${entryId}`, { headers });
      fetchWaitlist();
      alert('Customer removed from waitlist!');
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      alert('Error removing from waitlist');
    }
  };

  const fetchRoomMap = async () => {
    try {
      const [lockersRes, smallRoomsRes, regularRoomsRes, deluxeRoomsRes, activeCheckinsRes] = await Promise.all([
        axios.get(`${API}/rooms/available/locker`),
        axios.get(`${API}/rooms/available/small_room`),
        axios.get(`${API}/rooms/available/regular_room`),
        axios.get(`${API}/rooms/available/deluxe_room`),
        axios.get(`${API}/checkins/active`)
      ]);

      // Get occupied rooms from active check-ins
      const occupiedRooms = activeCheckinsRes.data.map(checkin => ({
        number: checkin.room_number,
        type: checkin.room_type,
        customer: `${checkin.customer?.first_name} ${checkin.customer?.last_name}`
      }));

      console.log('Occupied rooms:', occupiedRooms); // Debug log

      // Create complete room map
      const allLockers = Array.from({length: 114}, (_, i) => i + 40); // 40-153
      const allSmallRooms = Array.from({length: 18}, (_, i) => i + 7); // 7-24
      const allRegularRooms = [...Array.from({length: 6}, (_, i) => i + 1), ...Array.from({length: 8}, (_, i) => i + 25)]; // 1-6, 25-32
      const allDeluxeRooms = Array.from({length: 6}, (_, i) => i + 34); // 34-39

      const mapLockers = allLockers.map(num => {
        const occupied = occupiedRooms.find(r => r.number === num && r.type === 'locker');
        return {
          number: num,
          type: 'locker',
          available: !occupied, // Available if NOT occupied
          customer: occupied ? occupied.customer : null
        };
      });

      const mapRooms = [
        ...allSmallRooms.map(num => {
          const occupied = occupiedRooms.find(r => r.number === num && r.type === 'small_room');
          return {
            number: num,
            type: 'small_room',
            label: 'Small Room (No TV)',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'green'
          };
        }),
        ...allRegularRooms.map(num => {
          const occupied = occupiedRooms.find(r => r.number === num && r.type === 'regular_room');
          return {
            number: num,
            type: 'regular_room',
            label: 'Regular Room (With TV)',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'purple'
          };
        }),
        ...allDeluxeRooms.map(num => {
          const occupied = occupiedRooms.find(r => r.number === num && r.type === 'deluxe_room');
          return {
            number: num,
            type: 'deluxe_room',
            label: 'Deluxe Room (With TV)',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'gold'
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
      const response = await axios.post(`${API}/customers`, customerForm);
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
      const response = await axios.get(`${API}/rooms/available/${roomType}`);
      setAvailableRooms(response.data.available_rooms);
      setRoomDetails(response.data.room_details || []);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
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
      if (!checkinForm.membership_type) {
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
        membership_type: checkinForm.membership_type,
        room_type: finalRoomType,
        room_number: parseInt(checkinForm.room_number)
      };

      console.log('📤 Sending check-in data:', JSON.stringify(checkInData, null, 2));
      console.log('🌐 API endpoint:', `${API}/checkin`);

      const response = await axios.post(`${API}/checkin`, checkInData);
      
      console.log('✅ Check-in response received:', JSON.stringify(response.data, null, 2));
      
      // Set up payment data
      const paymentInfo = {
        checkInId: response.data.id,
        customerName: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
        totalAmount: response.data.total_amount,
        paymentMethod: '',
        additionalItems: []
      };

      console.log('💰 Setting payment data:', JSON.stringify(paymentInfo, null, 2));
      
      setPaymentData(paymentInfo);
      
      // Close check-in dialog and open payment dialog
      console.log('🔄 Closing check-in dialog...');
      setShowCheckIn(false);
      
      // Use a longer delay to ensure state updates properly
      setTimeout(() => {
        console.log('💳 Opening payment dialog...');
        setShowPayment(true);
        console.log('✅ Payment dialog state should be true now');
      }, 300);
      
      // Clear form and customer selection
      setSelectedCustomer(null);
      setCheckinForm({
        membership_type: '',
        accommodation_type: '',
        room_type: '',
        room_number: ''
      });
      
      console.log('🎉 Check-in process completed successfully!');
      
    } catch (error) {
      console.error('💥 Error checking in customer:', error);
      console.error('💥 Error response:', error.response);
      console.error('💥 Error details:', error.response?.data);
      
      let errorMessage = 'Error checking in customer';
      if (error.response?.data?.detail) {
        errorMessage += ': ' + error.response.data.detail;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    }
    
    console.log('⏳ Setting loading to false');
    setLoading(false);
    console.log('🏁 handleCheckIn function END');
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setPaymentData({
      checkInId: '',
      customerName: '',
      totalAmount: 0,
      paymentMethod: '',
      additionalItems: []
    });
    fetchActiveCheckins();
  };

  const handleCheckOut = async (checkinId) => {
    try {
      await axios.put(`${API}/checkin/${checkinId}/checkout`);
      fetchActiveCheckins();
    } catch (error) {
      console.error('Error checking out customer:', error);
      alert('Error checking out customer');
    }
  };

  const formatRemainingTime = (hours) => {
    if (hours <= 0) return 'OVERTIME';
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header-dark shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-white flex-brand">
                Flex Spa <span className="flex-accent">Los Angeles</span>
              </h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className={`grid w-full ${user?.role === 'manager' ? 'grid-cols-8' : 'grid-cols-6'} bg-transparent`}>
            <TabsTrigger value="search" className="tab-dark">Customer Management</TabsTrigger>
            <TabsTrigger value="pending" className="tab-dark">
              Pending Approvals {pendingCustomers.length > 0 && (
                <Badge className="ml-1 bg-red-600 text-white">{pendingCustomers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="tab-dark">Active Check-ins</TabsTrigger>
            <TabsTrigger value="map" className="tab-dark">Room Map</TabsTrigger>
            <TabsTrigger value="qr" className="tab-dark">QR Code</TabsTrigger>
            <TabsTrigger value="reports" className="tab-dark">Sales Reports</TabsTrigger>
            {user?.role === 'manager' && (
              <TabsTrigger value="employees" className="tab-dark">Employees</TabsTrigger>
            )}
            {user?.role === 'manager' && (
              <TabsTrigger value="admin" className="tab-dark">Admin Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card className="dashboard-card">
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
                  <Button variant="outline" onClick={() => setShowAddCustomer(true)} className="border-white/20 text-white hover:bg-white/10">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {customers.length > 0 && (
              <Card className="dashboard-card">
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
                              {customer.first_name} {customer.last_name}
                            </h3>
                            <p className="text-sm text-gray-300">ID: {customer.id_number}</p>
                            <p className="text-sm text-gray-300">DOB: {customer.date_of_birth}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {customer.is_banned && (
                            <Badge variant="destructive">Banned</Badge>
                          )}
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                              setShowCheckIn(true);
                            }}
                            disabled={customer.is_banned}
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
            {/* Pending Customer Approvals */}
            <Card className="dashboard-card">
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
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Clock className="h-5 w-5 mr-2" />
                  Active Check-ins ({activeCheckins.length})
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Currently checked-in customers and their remaining time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeCheckins.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active check-ins</p>
                ) : (
                  <div className="grid gap-4">
                    {activeCheckins.map((checkin) => (
                      <div
                        key={checkin.id}
                        className={`p-4 border rounded-lg ${checkin.is_overtime ? 'border-red-300 bg-red-900/20' : 'border-white/20 bg-white/5'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback className="bg-red-600 text-white">
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
                                  {checkin.room_type.replace('_', ' ').toUpperCase()} #{checkin.room_number}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            {/* Room Map */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <MapPin className="h-5 w-5 mr-2" />
                  Room & Locker Availability Map
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Real-time view of all rooms and lockers
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
                      <span className="text-gray-300">Occupied</span>
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
                          className={`relative p-2 text-xs text-center rounded border cursor-pointer ${
                            locker.available 
                              ? 'bg-green-600 border-green-400 text-white' 
                              : 'bg-red-600 border-red-400 text-white'
                          }`}
                          title={locker.customer ? `Occupied by: ${locker.customer}` : 'Available'}
                        >
                          {locker.number}
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
                    
                    {/* Small Rooms */}
                    <div className="mb-4">
                      <h4 className="text-lg text-green-400 mb-2">Small Rooms (No TV) - 7-24</h4>
                      <div className="grid grid-cols-9 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'small_room').map((room) => (
                          <div
                            key={room.number}
                            className={`relative p-3 text-sm text-center rounded border cursor-pointer ${
                              room.available 
                                ? 'bg-green-600 border-green-400 text-white' 
                                : 'bg-red-600 border-red-400 text-white'
                            }`}
                            title={room.customer ? `Occupied by: ${room.customer}` : 'Available'}
                          >
                            {room.number}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Regular Rooms */}
                    <div className="mb-4">
                      <h4 className="text-lg text-purple-400 mb-2">Regular Rooms (With TV) - 1-6, 25-32</h4>
                      <div className="grid grid-cols-8 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'regular_room').map((room) => (
                          <div
                            key={room.number}
                            className={`relative p-3 text-sm text-center rounded border cursor-pointer ${
                              room.available 
                                ? 'bg-green-600 border-green-400 text-white' 
                                : 'bg-red-600 border-red-400 text-white'
                            }`}
                            title={room.customer ? `Occupied by: ${room.customer}` : 'Available'}
                          >
                            {room.number}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deluxe Rooms */}
                    <div>
                      <h4 className="text-lg text-yellow-400 mb-2">Deluxe Rooms (With TV) - 34-39</h4>
                      <div className="grid grid-cols-6 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'deluxe_room').map((room) => (
                          <div
                            key={room.number}
                            className={`relative p-3 text-sm text-center rounded border cursor-pointer ${
                              room.available 
                                ? 'bg-green-600 border-green-400 text-white' 
                                : 'bg-red-600 border-red-400 text-white'
                            }`}
                            title={room.customer ? `Occupied by: ${room.customer}` : 'Available'}
                          >
                            {room.number}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Employee Management */}
            {user?.role === 'manager' && (
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Users className="h-5 w-5 mr-2" />
                    Employee Management
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Add, view, and manage employee accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white">Current Employees</h3>
                      <Button onClick={() => setShowAddEmployee(true)} className="flex-button">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </div>

                    <Button onClick={fetchEmployees} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      Refresh Employee List
                    </Button>

                    <div className="grid gap-4">
                      {employees.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback className="bg-blue-600 text-white">
                                {employee.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-white">{employee.username}</h3>
                              <p className="text-sm text-gray-300">Role: {employee.role}</p>
                              <p className="text-xs text-gray-400">
                                Created: {new Date(employee.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={employee.role === 'manager' ? 'badge-manager' : 'bg-blue-600'}>
                              {employee.role.toUpperCase()}
                            </Badge>
                            {employee.id !== user.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete ${employee.username}?`)) {
                                    try {
                                      await axios.delete(`${API}/users/${employee.id}`);
                                      fetchEmployees();
                                    } catch (error) {
                                      alert('Error deleting employee');
                                    }
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Admin Settings Tab */}
          <TabsContent value="admin" className="space-y-6">
            {user?.role === 'manager' && (
              <div className="space-y-6">
                {/* Discount Management */}
                <Card className="dashboard-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Discount Management
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Create and manage discount options (whole amounts only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Active Discounts</h3>
                        <Button onClick={() => setShowAddDiscount(true)} className="flex-button">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Discount
                        </Button>
                      </div>

                      <Button onClick={fetchAdminDiscounts} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Refresh Discounts
                      </Button>

                      <div className="grid gap-4">
                        {adminDiscounts.filter(d => !d.is_ghost).map((discount) => (
                          <div key={discount.id} className="flex items-center justify-between p-4 border border-yellow-500/50 rounded-lg bg-yellow-600/10">
                            <div>
                              <h3 className="font-semibold text-white">{discount.name}</h3>
                              <p className="text-sm text-gray-300">Amount: ${discount.amount}</p>
                              {discount.description && (
                                <p className="text-xs text-gray-400">{discount.description}</p>
                              )}
                              <p className="text-xs text-gray-400">
                                Status: {discount.active ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => toggleDiscount(discount.id)}
                                className={discount.active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
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
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Items Management */}
                <Card className="dashboard-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Plus className="h-5 w-5 mr-2" />
                      Additional Items Management
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage items available for purchase (condoms, accessories, fees, etc.)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Available Items</h3>
                        <div className="flex space-x-2">
                          <Button onClick={seedDefaultItems} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                            Seed Defaults
                          </Button>
                          <Button onClick={() => setShowAddItem(true)} className="flex-button">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>

                      <Button onClick={fetchAdminItems} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Refresh Items
                      </Button>

                      <div className="grid gap-4">
                        {adminItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border border-blue-500/50 rounded-lg bg-blue-600/10">
                            <div>
                              <h3 className="font-semibold text-white">{item.name}</h3>
                              <p className="text-sm text-gray-300">Price: ${item.price}</p>
                              <p className="text-xs text-gray-400">Category: {item.category}</p>
                              <p className="text-xs text-gray-400">
                                Status: {item.active ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => setEditingItem(item)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => toggleAdminItem(item.id)}
                                className={item.active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
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
                    </div>
                  </CardContent>
                </Card>

                {/* Secret Code Information */}
                <Card className="dashboard-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Secret Discount Code
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      100% Ghost Discount activation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/50">
                      <p className="text-white font-medium mb-2">Secret Code: Shift + 1 + 0</p>
                      <p className="text-gray-300 text-sm mb-2">
                        Press and hold Shift, then press 1, then press 0 to activate the ghost discount.
                      </p>
                      <p className="text-yellow-300 text-xs">
                        Ghost discounts are 100% off and do not appear in sales reports.
                      </p>
                      {secretCodeActive && (
                        <div className="mt-3 p-2 bg-green-600/20 border border-green-500/50 rounded">
                          <p className="text-green-300 text-sm">🙈 Ghost discount is currently active!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="qr" className="space-y-6">
            {/* QR Code Section */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="h-5 w-5 mr-2" />
                  Membership Form QR Code
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Generate QR code for customers to pre-fill membership forms
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="max-w-md mx-auto space-y-4">
                  {qrCodeUrl && (
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img src={qrCodeUrl} alt="Membership Form QR Code" className="mx-auto" />
                    </div>
                  )}
                  <div className="text-gray-300">
                    <p className="font-medium mb-2">Scan to access membership form</p>
                    <p className="text-sm">
                      Customers can scan this QR code to fill out their membership information 
                      while waiting in line, making the check-in process faster.
                    </p>
                    <p className="text-xs mt-3 text-gray-400">
                      URL: {window.location.origin}/membership
                    </p>
                  </div>
                  <Button 
                    onClick={generateQRCode} 
                    className="flex-button"
                  >
                    Regenerate QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Sales Reports */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Daily Sales Report
                </CardTitle>
                <CardDescription className="text-gray-300">
                  View daily sales summary and breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Button onClick={() => fetchSalesReport(reportDate)} className="flex-button">
                      Generate Report
                    </Button>
                  </div>

                  {salesReport && (
                    <div className="grid gap-4">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/50">
                          <h3 className="text-green-400 font-semibold">Total Revenue</h3>
                          <p className="text-2xl font-bold text-white">${salesReport.total_revenue}</p>
                        </div>
                        <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/50">
                          <h3 className="text-blue-400 font-semibold">Total Check-ins</h3>
                          <p className="text-2xl font-bold text-white">{salesReport.total_checkins}</p>
                        </div>
                        <div className="bg-purple-600/20 p-4 rounded-lg border border-purple-500/50">
                          <h3 className="text-purple-400 font-semibold">Average per Check-in</h3>
                          <p className="text-2xl font-bold text-white">${salesReport.average_per_checkin.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Breakdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Room Type Breakdown */}
                        <div className="bg-black/40 p-4 rounded-lg border border-white/20">
                          <h3 className="text-white font-semibold mb-3">Room Type Breakdown</h3>
                          {Object.entries(salesReport.room_breakdown).map(([type, data]) => (
                            <div key={type} className="flex justify-between text-sm text-gray-300 mb-2">
                              <span className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                  type === 'locker' ? 'bg-blue-500' :
                                  type === 'small_room' ? 'bg-green-500' :
                                  type === 'regular_room' ? 'bg-purple-500' :
                                  type === 'deluxe_room' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></div>
                                {type.replace('_', ' ').toUpperCase()}: {data.count}
                              </span>
                              <span className="text-white">${data.revenue}</span>
                            </div>
                          ))}
                        </div>

                        {/* Membership Breakdown */}
                        <div className="bg-black/40 p-4 rounded-lg border border-white/20">
                          <h3 className="text-white font-semibold mb-3">Membership Breakdown</h3>
                          {Object.entries(salesReport.membership_breakdown).map(([type, data]) => (
                            <div key={type} className="flex justify-between text-sm text-gray-300 mb-2">
                              <span>{type === '1_day' ? '1-Day Pass' : '6-Month Pass'}: {data.count}</span>
                              <span className="text-white">${data.revenue}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Employee Performance */}
                      <div className="bg-black/40 p-4 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold mb-3">Employee Performance</h3>
                        {Object.entries(salesReport.employee_breakdown).map(([empId, data]) => (
                          <div key={empId} className="flex justify-between text-sm text-gray-300 mb-2">
                            <span>{salesReport.employee_names[empId]}: {data.count} check-ins</span>
                            <span className="text-white">${data.revenue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-[425px] dashboard-card">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Customer</DialogTitle>
            <DialogDescription className="text-gray-300">
              Enter customer information to create a new profile
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={customerForm.first_name}
                  onChange={(e) => setCustomerForm({...customerForm, first_name: e.target.value})}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Input
                  placeholder="Last Name"
                  value={customerForm.last_name}
                  onChange={(e) => setCustomerForm({...customerForm, last_name: e.target.value})}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <Input
                placeholder="ID Number"
                value={customerForm.id_number}
                onChange={(e) => setCustomerForm({...customerForm, id_number: e.target.value})}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Input
                type="date"
                placeholder="Date of Birth"
                value={customerForm.date_of_birth}
                onChange={(e) => setCustomerForm({...customerForm, date_of_birth: e.target.value})}
                required
                className="bg-white/10 border-white/20 text-white"
              />
              <Input
                type="date"
                placeholder="ID Expiration Date"
                value={customerForm.id_expiration_date}
                onChange={(e) => setCustomerForm({...customerForm, id_expiration_date: e.target.value})}
                required
                className="bg-white/10 border-white/20 text-white"
              />
              <Input
                placeholder="State of ID"
                value={customerForm.state_of_id}
                onChange={(e) => setCustomerForm({...customerForm, state_of_id: e.target.value})}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddCustomer(false)} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-button">
                Add Customer
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
        <DialogContent className="sm:max-w-[425px] dashboard-card" style={{zIndex: 8888}}>
          <DialogHeader>
            <DialogTitle className="text-white">Check In Customer</DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedCustomer && `Check in ${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
            </DialogDescription>
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-400 mt-2">
              Debug: {JSON.stringify(checkinForm)}
            </div>
          </DialogHeader>
          <div>
            <div className="grid gap-4 py-4" style={{position: 'relative', zIndex: 1}}>
              <div style={{zIndex: 10}}>
                <Select 
                  value={checkinForm.membership_type} 
                  onValueChange={(value) => {
                    console.log('Membership type selected:', value);
                    setCheckinForm({...checkinForm, membership_type: value});
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white" style={{zIndex: 10}}>
                    <SelectValue placeholder="Select Membership Type" />
                  </SelectTrigger>
                  <SelectContent style={{zIndex: 9999}}>
                    <SelectItem value="1_day">1-Day Pass ($10)</SelectItem>
                    <SelectItem value="6_month">6-Month Pass ($25)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div style={{zIndex: 9}}>
                <Select 
                  value={checkinForm.accommodation_type} 
                  onValueChange={(value) => {
                    console.log('Accommodation type selected:', value);
                    setCheckinForm({...checkinForm, accommodation_type: value, room_type: '', room_number: ''});
                    setAvailableRooms([]);
                    setRoomDetails([]);
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white" style={{zIndex: 9}}>
                    <SelectValue placeholder="Select Accommodation Type" />
                  </SelectTrigger>
                  <SelectContent style={{zIndex: 9999}}>
                    <SelectItem value="locker">🔵 LOCKERS (40-153)</SelectItem>
                    <SelectItem value="room">🏠 ROOMS (Various Types)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {checkinForm.accommodation_type === 'locker' && (
                <div style={{zIndex: 8}}>
                  <Select 
                    value={checkinForm.room_number} 
                    onValueChange={(value) => {
                      console.log('Locker number selected:', value);
                      setCheckinForm({...checkinForm, room_type: 'locker', room_number: value});
                    }}
                    onOpenChange={(open) => {
                      if (open) {
                        console.log('Loading available lockers...');
                        fetchAvailableRooms('locker');
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white" style={{zIndex: 8}}>
                      <SelectValue placeholder="Select Locker Number" />
                    </SelectTrigger>
                    <SelectContent style={{zIndex: 9999}}>
                      {roomDetails.filter(room => room.type === 'locker').map((room) => (
                        <SelectItem key={room.number} value={room.number.toString()}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>Locker #{room.number}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {checkinForm.accommodation_type === 'room' && (
                <>
                  <div style={{zIndex: 8}}>
                    <Select 
                      value={checkinForm.room_type} 
                      onValueChange={(value) => {
                        setCheckinForm({...checkinForm, room_type: value, room_number: ''});
                        fetchAvailableRooms(value);
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white" style={{zIndex: 8}}>
                        <SelectValue placeholder="Select Room Type" />
                      </SelectTrigger>
                      <SelectContent style={{zIndex: 9999}}>
                        <SelectItem value="small_room">🟢 Small Room - No TV ($33/$36)</SelectItem>
                        <SelectItem value="regular_room">🟣 Regular Room - With TV ($40/$45)</SelectItem>
                        <SelectItem value="deluxe_room">🟡 Deluxe Room - With TV ($45/$50)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {checkinForm.room_type && (
                    <div style={{zIndex: 7}}>
                      <Select 
                        value={checkinForm.room_number} 
                        onValueChange={(value) => setCheckinForm({...checkinForm, room_number: value})}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white" style={{zIndex: 7}}>
                          <SelectValue placeholder="Select Room Number" />
                        </SelectTrigger>
                        <SelectContent style={{zIndex: 9999}}>
                          {roomDetails.filter(room => room.type === checkinForm.room_type).map((room) => (
                            <SelectItem key={room.number} value={room.number.toString()}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  room.color === 'green' ? 'bg-green-500' :
                                  room.color === 'purple' ? 'bg-purple-500' :
                                  room.color === 'gold' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></div>
                                <span>{room.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCheckIn(false)} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button 
                type="button"
                disabled={loading || !checkinForm.room_number || !checkinForm.membership_type} 
                className="flex-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  console.log('🔥 CHECK IN BUTTON CLICKED - FINAL VERSION');
                  console.log('📋 Form state:', checkinForm);
                  console.log('👤 Customer:', selectedCustomer);
                  
                  // Clean up any overlays
                  const overlays = document.querySelectorAll('[data-radix-select-content][data-state="open"]');
                  overlays.forEach(overlay => {
                    overlay.style.display = 'none';
                    overlay.style.pointerEvents = 'none';
                  });
                  
                  console.log('🚀 About to call handleCheckIn...');
                  
                  try {
                    handleCheckIn(e);
                    console.log('✅ handleCheckIn called successfully');
                  } catch (error) {
                    console.error('❌ Error calling handleCheckIn:', error);
                    alert('Error: ' + error.message);
                  }
                }}
              >
                {loading ? 'Processing...' : 'Check In'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      {user?.role === 'manager' && (
        <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
          <DialogContent className="sm:max-w-[425px] dashboard-card">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Employee</DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a new employee login account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addEmployee}>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Username"
                  value={employeeForm.username}
                  onChange={(e) => setEmployeeForm({...employeeForm, username: e.target.value})}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({...employeeForm, password: e.target.value})}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Select 
                  value={employeeForm.role} 
                  onValueChange={(value) => setEmployeeForm({...employeeForm, role: value})}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddEmployee(false)} className="border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-button">
                  Add Employee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-[500px] dashboard-card">
          <DialogHeader>
            <DialogTitle className="text-white">Payment & Transaction</DialogTitle>
            <DialogDescription className="text-gray-300">
              Complete payment for {paymentData.customerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Transaction Summary */}
            <div className="bg-black/40 p-4 rounded-lg border border-white/20">
              <h3 className="font-semibold text-white mb-2">Transaction Summary</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-white">{paymentData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="text-white font-semibold">${paymentData.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method *
              </label>
              <Select 
                value={paymentData.paymentMethod} 
                onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Items */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Items (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const newItems = [...paymentData.additionalItems];
                    const existing = newItems.find(item => item.name === 'Sandals');
                    if (existing) {
                      existing.quantity += 1;
                    } else {
                      newItems.push({name: 'Sandals', price: 15, quantity: 1});
                    }
                    setPaymentData({
                      ...paymentData, 
                      additionalItems: newItems,
                      totalAmount: paymentData.totalAmount + 15
                    });
                  }}
                >
                  🩴 Sandals (+$15)
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const newItems = [...paymentData.additionalItems];
                    const existing = newItems.find(item => item.name === 'Cleaning Fee');
                    if (!existing) {
                      newItems.push({name: 'Cleaning Fee', price: 10, quantity: 1});
                      setPaymentData({
                        ...paymentData, 
                        additionalItems: newItems,
                        totalAmount: paymentData.totalAmount + 10
                      });
                    }
                  }}
                >
                  🧽 Cleaning Fee (+$10)
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const newItems = [...paymentData.additionalItems];
                    const existing = newItems.find(item => item.name === 'Lost Key Fee');
                    if (!existing) {
                      newItems.push({name: 'Lost Key Fee', price: 25, quantity: 1});
                      setPaymentData({
                        ...paymentData, 
                        additionalItems: newItems,
                        totalAmount: paymentData.totalAmount + 25
                      });
                    }
                  }}
                >
                  🔑 Lost Key Fee (+$25)
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const newItems = [...paymentData.additionalItems];
                    const existing = newItems.find(item => item.name === 'Adult Items');
                    if (existing) {
                      existing.quantity += 1;
                    } else {
                      newItems.push({name: 'Adult Items', price: 20, quantity: 1});
                    }
                    setPaymentData({
                      ...paymentData, 
                      additionalItems: newItems,
                      totalAmount: paymentData.totalAmount + 20
                    });
                  }}
                >
                  🔞 Adult Items (+$20)
                </Button>
              </div>
            </div>

            {/* Additional Items List */}
            {paymentData.additionalItems.length > 0 && (
              <div className="bg-black/40 p-3 rounded-lg border border-white/20">
                <h4 className="text-white font-medium mb-2">Additional Items:</h4>
                {paymentData.additionalItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-300">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Updated Total */}
            <div className="bg-red-600/20 p-3 rounded-lg border border-red-500/50">
              <div className="flex justify-between text-white font-semibold">
                <span>Final Total:</span>
                <span>${paymentData.totalAmount}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowPayment(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentComplete}
              disabled={!paymentData.paymentMethod}
              className="flex-button"
            >
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Discount Dialog */}
      <Dialog open={showAddDiscount} onOpenChange={setShowAddDiscount}>
        <DialogContent className="sm:max-w-md admin-dialog">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Discount</DialogTitle>
            <DialogDescription className="text-gray-300">
              Create a new discount with a fixed amount (not percentage)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addDiscount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Name *
              </label>
              <Input
                type="text"
                value={discountForm.name}
                onChange={(e) => setDiscountForm({...discountForm, name: e.target.value})}
                placeholder="FREE LOCKER"
                required
                className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Amount ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={discountForm.amount}
                onChange={(e) => setDiscountForm({...discountForm, amount: e.target.value})}
                placeholder="25.00"
                required
                className="w-full bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <Input
                type="text"
                value={discountForm.description}
                onChange={(e) => setDiscountForm({...discountForm, description: e.target.value})}
                placeholder="Free locker promotion"
                className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowAddDiscount(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="flex-button"
              >
                {loading ? 'Creating...' : 'Create Discount'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-md admin-dialog">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Item</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update item details and pricing
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              updateAdminItem(editingItem.id, {
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category')
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Item Name *
                </label>
                <Input
                  name="name"
                  type="text"
                  defaultValue={editingItem.name}
                  required
                  className="w-full bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price ($) *
                </label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingItem.price}
                  required
                  className="w-full bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <Select defaultValue={editingItem.category}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="fees">Fees</SelectItem>
                  </SelectContent>
                </Select>
                <input name="category" type="hidden" value={editingItem.category} />
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setEditingItem(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-button"
                >
                  Update Item
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Room Upgrade Dialog */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="sm:max-w-md admin-dialog">
          <DialogHeader>
            <DialogTitle className="text-white">Upgrade Room/Locker</DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedCheckin && `Upgrade ${selectedCheckin.customer?.first_name} ${selectedCheckin.customer?.last_name} from ${selectedCheckin.room_type.replace('_', ' ').toUpperCase()} #${selectedCheckin.room_number}`}
            </DialogDescription>
          </DialogHeader>
          {selectedCheckin && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await axios.post(`${API}/checkin/${selectedCheckin.id}/upgrade`, {
                  new_room_type: upgradeForm.new_room_type,
                  new_room_number: parseInt(upgradeForm.new_room_number)
                }, { headers });
                
                alert(`Upgrade successful! Additional cost: $${response.data.additional_cost}`);
                setShowUpgrade(false);
                setUpgradeForm({ new_room_type: '', new_room_number: '' });
                fetchActiveCheckins();
              } catch (error) {
                alert(error.response?.data?.detail || 'Error upgrading room');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Room Type *
                </label>
                <Select value={upgradeForm.new_room_type} onValueChange={(value) => setUpgradeForm({...upgradeForm, new_room_type: value, new_room_number: ''})}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locker">Locker ($25 weekday, $28 weekend)</SelectItem>
                    <SelectItem value="small_room">Small Room ($33 weekday, $36 weekend)</SelectItem>
                    <SelectItem value="regular_room">Regular Room ($40 weekday, $45 weekend)</SelectItem>
                    <SelectItem value="deluxe_room">Deluxe Room ($45 weekday, $50 weekend)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {upgradeForm.new_room_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available {upgradeForm.new_room_type.replace('_', ' ')} Numbers *
                  </label>
                  <Select value={upgradeForm.new_room_number} onValueChange={(value) => setUpgradeForm({...upgradeForm, new_room_number: value})}>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select room number" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms[upgradeForm.new_room_type]?.map(room => (
                        <SelectItem key={room} value={room.toString()}>{room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="bg-yellow-600/20 p-3 rounded-lg border border-yellow-500/50">
                <p className="text-yellow-200 text-sm">
                  <strong>Note:</strong> Cleaning fee of $5 applies when upgrading from or to a room (not locker).
                </p>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowUpgrade(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!upgradeForm.new_room_type || !upgradeForm.new_room_number}
                  className="flex-button"
                >
                  Upgrade Room
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/membership" element={<MembershipForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;