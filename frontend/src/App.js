import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
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
  Lock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import MembershipForm from './MembershipForm';

const API = process.env.REACT_APP_BACKEND_URL;

function App() {
  const navigate = useNavigate();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
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

  // Add debugging for modal state
  useEffect(() => {
    console.log('Modal states:', {
      showAddCustomer,
      showCheckIn,
      showPayment,
      showUpgrade,
      showOvertimePayment,
      showOvertimePrompt,
      showRoomManagement
    });
  }, [showAddCustomer, showCheckIn, showPayment, showUpgrade, showOvertimePayment, showOvertimePrompt, showRoomManagement]);
  
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
    discountAmount: 0
  });
  const [additionalItems, setAdditionalItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [adminDiscounts, setAdminDiscounts] = useState([]);
  const [adminItems, setAdminItems] = useState([]);
  
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
  
  // Waitlist state
  const [waitlist, setWaitlist] = useState({
    regular_room: [],
    small_room: [],
    deluxe_room: []
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

  // Customer overtime checkout state
  const [checkoutOvertimeData, setCheckoutOvertimeData] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

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
      }
      
      // Fetch room map data
      fetchRoomMap();
    }
  }, [isAuthenticated, user]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/api/login`, loginForm);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials');
    }
    
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  const searchCustomers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/api/customers?q=${searchQuery}`, { headers });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
      alert('Error searching customers');
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
      const response = await axios.get(`${API}/api/users`, { headers });
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
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/waitlist/${entryId}`, { headers });
      fetchWaitlist();
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      alert('Error removing from waitlist');
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
      await axios.post(`${API}/api/users`, newEmployee, { headers });
      setNewEmployee({ username: '', password: '', role: 'employee' });
      setShowAddEmployee(false);
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
      await axios.put(`${API}/api/users/${userId}/assign-locker?locker_number=${lockerNumber}`, {}, { headers });
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
      const response = await axios.post(`${API}/api/checkin/${selectedCheckin.id}/upgrade`, {
        new_room_type: upgradeData.new_room_type,
        new_room_number: parseInt(upgradeData.new_room_number)
      }, { headers });
      
      alert(`Upgrade successful! Additional cost: $${response.data.additional_cost.toFixed(2)}`);
      setShowUpgrade(false);
      setUpgradeData({ new_room_type: '', new_room_number: '' });
      setSelectedCheckin(null);
      fetchActiveCheckins();
      fetchAvailableRooms(upgradeData.new_room_type);
    } catch (error) {
      console.error('Error upgrading room:', error);
      alert(error.response?.data?.detail || 'Error upgrading room');
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
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.post(`${API}/api/discounts`, newDiscount, { headers });
      setNewDiscount({ name: '', amount: '', description: '' });
      setShowAddDiscount(false);
      fetchDiscounts();
      fetchAdminDiscounts();
      alert('Discount created successfully!');
    } catch (error) {
      console.error('Error creating discount:', error);
      alert(error.response?.data?.detail || 'Error creating discount');
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

  const deleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/discounts/${discountId}`, { headers });
      fetchDiscounts();
      fetchAdminDiscounts();
      alert('Discount deleted successfully!');
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Error deleting discount');
    }
  };

  const createAdditionalItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
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
      alert(error.response?.data?.detail || 'Error creating additional item');
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

  const deleteAdditionalItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/additional-items/${itemId}`, { headers });
      fetchAdditionalItems();
      fetchAdminItems();
      alert('Additional item deleted successfully!');
    } catch (error) {
      console.error('Error deleting additional item:', error);
      alert('Error deleting additional item');
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
            label: 'Small Room (No TV)',
            available: !occupied, // Available if NOT occupied
            customer: occupied ? occupied.customer : null,
            color: 'green',
            remaining_hours: occupied ? occupied.remaining_hours : null,
            is_overtime: occupied ? occupied.is_overtime : false,
            checkin_id: occupied ? occupied.checkin_id : null
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
            color: 'purple',
            remaining_hours: occupied ? occupied.remaining_hours : null,
            is_overtime: occupied ? occupied.is_overtime : false,
            checkin_id: occupied ? occupied.checkin_id : null
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
            color: 'gold',
            remaining_hours: occupied ? occupied.remaining_hours : null,
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
      const response = await axios.post(`${API}/api/customers`, customerForm);
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
      console.log('🌐 API endpoint:', `${API}/api/checkin`);

      const response = await axios.post(`${API}/api/checkin`, checkInData);
      
      console.log('✅ Check-in response received:', JSON.stringify(response.data, null, 2));
      
      // Handle membership validation message
      if (response.data.membership_status) {
        if (response.data.membership_status.using_existing) {
          alert(`✅ Using existing membership! Valid until ${new Date(response.data.membership_status.expiration_date).toLocaleDateString()}`);
        }
      }
      
      // Set up payment data
      const paymentInfo = {
        checkInId: response.data.id,
        customerName: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
        totalAmount: response.data.total_amount,
        paymentMethod: '',
        additionalItems: [],
        selectedDiscount: null,
        discountAmount: 0
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
      
      // Handle membership validation errors
      if (error.response?.status === 400 && error.response?.data?.detail) {
        if (error.response.data.detail.includes('valid 6-month membership') || 
            error.response.data.detail.includes('no valid membership')) {
          // Show membership validation error
          alert(`❌ Membership Required: ${error.response.data.detail}`);
          setLoading(false);
          return;
        }
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
    
    setShowPayment(false);
    setPaymentData({
      checkInId: '',
      customerName: '',
      totalAmount: 0,
      paymentMethod: '',
      additionalItems: [],
      selectedDiscount: null,
      discountAmount: 0
    });
    fetchActiveCheckins();
  };

  const handleCheckOut = async (checkinId) => {
    try {
      const response = await axios.put(`${API}/api/checkin/${checkinId}/checkout`);
      
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
      // Handle immediate payment - could open payment dialog
      alert(`Overtime payment of $${checkoutOvertimeData.overtimeAmount.toFixed(2)} will be processed.`);
    } else {
      // IOU option - overtime is already recorded by backend
      alert(`Overtime of $${checkoutOvertimeData.overtimeAmount.toFixed(2)} recorded as IOU.`);
    }
    
    setShowOvertimePrompt(false);
    setCheckoutOvertimeData(null);
    fetchActiveCheckins();
  };

  const formatRemainingTime = (hours) => {
    if (hours <= 0) return 'OVERTIME';
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
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

  const getRoomBaseRate = (roomType) => {
    const rates = {
      'locker': 10,
      'small_room': 15,
      'regular_room': 20,
      'deluxe_room': 25
    };
    return rates[roomType] || 10;
  };

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
            <TabsList className={`grid w-full ${user?.role === 'manager' ? 'grid-cols-4' : 'grid-cols-3'} bg-transparent`}>
              <TabsTrigger value="search" className="tab-dark">Customer Management</TabsTrigger>
              <TabsTrigger value="pending" className="tab-dark">
                Pending Approvals {pendingCustomers.length > 0 && (
                  <Badge className="ml-1 bg-red-600 text-white">{pendingCustomers.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="tab-dark">Active Check-ins</TabsTrigger>
              <TabsTrigger value="map" className="tab-dark">Room Map</TabsTrigger>
            </TabsList>
            <TabsList className={`grid w-full ${user?.role === 'manager' ? 'grid-cols-4' : 'grid-cols-2'} bg-transparent`}>
              <TabsTrigger value="qr" className="tab-dark">QR Code</TabsTrigger>
              <TabsTrigger value="reports" className="tab-dark">Sales Reports</TabsTrigger>
              {user?.role === 'manager' && (
                <TabsTrigger value="employees" className="tab-dark">Employees</TabsTrigger>
              )}
              {user?.role === 'manager' && (
                <TabsTrigger value="admin" className="tab-dark">Admin Settings</TabsTrigger>
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
                </div>
              </CardContent>
            </Card>

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
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
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
                                      onClick={() => {
                                        // Renewal - same room, base rate
                                        setPaymentData({
                                          checkInId: checkin.id,
                                          customerName: `${checkin.customer?.first_name} ${checkin.customer?.last_name}`,
                                          totalAmount: getRoomBaseRate(checkin.room_type),
                                          paymentMethod: '',
                                          additionalItems: [],
                                          selectedDiscount: null,
                                          discountAmount: 0,
                                          transactionType: 'renewal'
                                        });
                                        setShowPayment(true);
                                      }}
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
                          SMALL ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'small_room').length})
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
                                      onClick={() => {
                                        // Renewal - same room, base rate
                                        setPaymentData({
                                          checkInId: checkin.id,
                                          customerName: `${checkin.customer?.first_name} ${checkin.customer?.last_name}`,
                                          totalAmount: getRoomBaseRate(checkin.room_type),
                                          paymentMethod: '',
                                          additionalItems: [],
                                          selectedDiscount: null,
                                          discountAmount: 0,
                                          transactionType: 'renewal'
                                        });
                                        setShowPayment(true);
                                      }}
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
                          REGULAR ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'regular_room').length})
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
                                      onClick={() => {
                                        // Renewal - same room, base rate
                                        setPaymentData({
                                          checkInId: checkin.id,
                                          customerName: `${checkin.customer?.first_name} ${checkin.customer?.last_name}`,
                                          totalAmount: getRoomBaseRate(checkin.room_type),
                                          paymentMethod: '',
                                          additionalItems: [],
                                          selectedDiscount: null,
                                          discountAmount: 0,
                                          transactionType: 'renewal'
                                        });
                                        setShowPayment(true);
                                      }}
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
                          DELUXE ROOMS ({activeCheckins.filter(checkin => checkin.room_type === 'deluxe_room').length})
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
                                      onClick={() => {
                                        // Renewal - same room, base rate
                                        setPaymentData({
                                          checkInId: checkin.id,
                                          customerName: `${checkin.customer?.first_name} ${checkin.customer?.last_name}`,
                                          totalAmount: getRoomBaseRate(checkin.room_type),
                                          paymentMethod: '',
                                          additionalItems: [],
                                          selectedDiscount: null,
                                          discountAmount: 0,
                                          transactionType: 'renewal'
                                        });
                                        setShowPayment(true);
                                      }}
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
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            {/* Room Map */}
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
                    
                    {/* Small Rooms */}
                    <div className="mb-4">
                      <h4 className="text-lg text-green-400 mb-2">Small Rooms (No TV) - 7-24</h4>
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

                    {/* Regular Rooms */}
                    <div className="mb-4">
                      <h4 className="text-lg text-purple-400 mb-2">Regular Rooms (With TV) - 1-6, 25-32</h4>
                      <div className="grid grid-cols-8 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'regular_room').map((room) => (
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

                    {/* Deluxe Rooms */}
                    <div>
                      <h4 className="text-lg text-yellow-400 mb-2">Deluxe Rooms (With TV) - 34-39</h4>
                      <div className="grid grid-cols-6 gap-2">
                        {roomMap.rooms.filter(room => room.type === 'deluxe_room').map((room) => (
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
                  </div>

                  {/* Waitlist Section - 3 Column Layout */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      WAITLISTS
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      {/* Regular Room Waitlist */}
                      <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                        <h4 className="text-lg text-purple-400 mb-3 text-center">Regular Room Waitlist</h4>
                        {waitlist.regular_room.length === 0 ? (
                          <p className="text-gray-400 text-center text-sm">No one waiting</p>
                        ) : (
                          <div className="space-y-2">
                            {waitlist.regular_room.map((entry, index) => (
                              <div key={entry.id} className="bg-purple-800/30 p-2 rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-medium">{index + 1}. {entry.customer?.first_name} {entry.customer?.last_name}</p>
                                    {entry.current_room_number && (
                                      <p className="text-purple-300 text-xs">
                                        Currently in: {entry.current_room_type?.replace('_', ' ')} #{entry.current_room_number}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-300 hover:text-red-100 hover:bg-red-900/30 h-6 w-6 p-0"
                                    onClick={() => removeFromWaitlist(entry.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Small Room Waitlist */}
                      <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                        <h4 className="text-lg text-green-400 mb-3 text-center">Small Room Waitlist</h4>
                        {waitlist.small_room.length === 0 ? (
                          <p className="text-gray-400 text-center text-sm">No one waiting</p>
                        ) : (
                          <div className="space-y-2">
                            {waitlist.small_room.map((entry, index) => (
                              <div key={entry.id} className="bg-green-800/30 p-2 rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-medium">{index + 1}. {entry.customer?.first_name} {entry.customer?.last_name}</p>
                                    {entry.current_room_number && (
                                      <p className="text-green-300 text-xs">
                                        Currently in: {entry.current_room_type?.replace('_', ' ')} #{entry.current_room_number}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-300 hover:text-red-100 hover:bg-red-900/30 h-6 w-6 p-0"
                                    onClick={() => removeFromWaitlist(entry.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Deluxe Room Waitlist */}
                      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                        <h4 className="text-lg text-yellow-400 mb-3 text-center">Deluxe Room Waitlist</h4>
                        {waitlist.deluxe_room.length === 0 ? (
                          <p className="text-gray-400 text-center text-sm">No one waiting</p>
                        ) : (
                          <div className="space-y-2">
                            {waitlist.deluxe_room.map((entry, index) => (
                              <div key={entry.id} className="bg-yellow-800/30 p-2 rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-medium">{index + 1}. {entry.customer?.first_name} {entry.customer?.last_name}</p>
                                    {entry.current_room_number && (
                                      <p className="text-yellow-300 text-xs">
                                        Currently in: {entry.current_room_type?.replace('_', ' ')} #{entry.current_room_number}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-300 hover:text-red-100 hover:bg-red-900/30 h-6 w-6 p-0"
                                    onClick={() => removeFromWaitlist(entry.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="space-y-6">
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
                      <img src={qrCodeUrl} alt="Membership Form QR Code" className="max-w-64 h-auto" />
                    </div>
                  ) : (
                    <div className="p-8 text-gray-400">Loading QR code...</div>
                  )}
                  <div className="text-sm text-gray-300">
                    <p>Customers can scan this QR code to fill out their membership information.</p>
                    <p>Applications will appear in the "Pending Approvals" tab for review.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Sales Reports */}
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
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white/10 border-white/20">
                          <CardContent className="p-4 text-center">
                            <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
                            <p className="text-2xl font-bold text-green-400">${salesData.total_revenue?.toFixed(2) || '0.00'}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/10 border-white/20">
                          <CardContent className="p-4 text-center">
                            <h3 className="text-lg font-semibold text-white">Total Transactions</h3>
                            <p className="text-2xl font-bold text-blue-400">{salesData.total_transactions || 0}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/10 border-white/20">
                          <CardContent className="p-4 text-center">
                            <h3 className="text-lg font-semibold text-white">Average Transaction</h3>
                            <p className="text-2xl font-bold text-purple-400">${salesData.average_transaction?.toFixed(2) || '0.00'}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {salesData.payment_breakdown && (
                        <Card className="bg-white/10 border-white/20">
                          <CardHeader>
                            <CardTitle className="text-white">Payment Method Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {Object.entries(salesData.payment_breakdown).map(([method, data]) => (
                                <div key={method} className="flex justify-between items-center p-2 bg-white/5 rounded">
                                  <span className="text-white capitalize">{method}</span>
                                  <div className="text-right">
                                    <span className="text-white font-semibold">${data.amount?.toFixed(2) || '0.00'}</span>
                                    <span className="text-gray-300 text-sm ml-2">({data.count || 0} transactions)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user?.role === 'manager' && (
            <TabsContent value="employees" className="space-y-6">
              {/* Employee Management */}
              <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Users className="h-5 w-5 mr-2" />
                    Employee Management
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage system users and their access levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => setShowAddEmployee(true)} className="flex-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Employee
                    </Button>

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
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                const roomNumber = window.prompt(`Assign a locker to ${employee.username}:\n\nEnter locker number (40-153):`);
                                if (roomNumber && roomNumber >= 40 && roomNumber <= 153) {
                                  alert(`Locker #${roomNumber} assigned to ${employee.username}`);
                                  // Here you could implement the actual assignment logic
                                } else if (roomNumber) {
                                  alert('Invalid locker number. Please enter a number between 40-153.');
                                }
                              }}
                            >
                              Assign Locker
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

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
                    <TabsList className="grid w-full grid-cols-3 bg-white/10">
                      <TabsTrigger value="discounts" className="tab-dark">Discounts</TabsTrigger>
                      <TabsTrigger value="items" className="tab-dark">Additional Items</TabsTrigger>
                      <TabsTrigger value="passwords" className="tab-dark">Password Management</TabsTrigger>
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
                onClick={() => {
                  // Renewal - same room, base rate
                  setPaymentData({
                    checkInId: selectedRoomForManagement.checkin.id,
                    customerName: `${selectedRoomForManagement.checkin.customer?.first_name} ${selectedRoomForManagement.checkin.customer?.last_name}`,
                    totalAmount: getRoomBaseRate(selectedRoomForManagement.room.type),
                    paymentMethod: '',
                    additionalItems: [],
                    selectedDiscount: null,
                    discountAmount: 0,
                    transactionType: 'renewal'
                  });
                  setShowRoomManagement(false);
                  setShowPayment(true);
                }}
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

      {/* Check-in Dialog */}
      {showCheckIn && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Check In: {selectedCustomer.first_name} {selectedCustomer.last_name}
            </h3>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                <Select onValueChange={(value) => setCheckinForm({...checkinForm, membership_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_day">1 Day ($10)</SelectItem>
                    <SelectItem value="6_month">6 Month ($25)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Type</label>
                <Select onValueChange={(value) => {
                  setCheckinForm({...checkinForm, accommodation_type: value, room_type: value});
                  if (value) fetchAvailableRooms(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accommodation" />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectContent>
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
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Processing</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium">Customer: {paymentData.customerName}</p>
                <p className="text-lg font-bold text-green-600">Total: ${paymentData.totalAmount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <Select onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={handlePaymentComplete} 
                  disabled={!paymentData.paymentMethod}
                  className="flex-1"
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
                    <SelectContent>
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
                      <SelectContent>
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
                  <SelectContent>
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
                <SelectContent>
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
                <SelectContent>
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
      
    </div>
  );
}

// Login Component
function LoginPage() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/api/login`, loginForm);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials');
    }
    
    setLoading(false);
  };

  if (isAuthenticated) {
    return <App />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: '#0f1419',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(30, 58, 138, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(30, 64, 175, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(23, 37, 84, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 90% 90%, rgba(30, 58, 138, 0.15) 0%, transparent 50%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div style={{ background: '#000000', padding: '12px', borderRadius: '8px', display: 'inline-block', marginBottom: '16px' }}>
            <img 
              src="https://customer-assets.emergentagent.com/job_bathhouse-admin/artifacts/vytho0m6_IMG_3221%202.jpg" 
              alt="Flex Spa Los Angeles"
              className="h-16 w-auto"
              style={{ maxHeight: '64px', objectFit: 'contain' }}
            />
          </div>
          <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
          <p className="text-gray-400 mt-2">Sign in to access the spa management system</p>
        </div>
        
        <Card className="dashboard-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(30, 58, 138, 0.3)', color: '#ffffff' }}>
          <CardContent className="p-6">
            <form onSubmit={login} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full flex-button"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main App Router
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/membership" element={<MembershipForm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}