import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

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
import { Search, Plus, LogOut, Users, Clock, DollarSign, AlertTriangle, User, MapPin, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://spa-manager.preview.emergentagent.com';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">FLEX_LA</CardTitle>
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
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
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
  const [activeCheckins, setActiveCheckins] = useState([]);
  const [loading, setLoading] = useState(false);

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
    room_type: '',
    room_number: ''
  });

  const [availableRooms, setAvailableRooms] = useState([]);

  useEffect(() => {
    fetchActiveCheckins();
  }, []);

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
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const checkInData = {
        customer_id: selectedCustomer.id,
        ...checkinForm
      };

      await axios.post(`${API}/checkin`, checkInData);
      
      setShowCheckIn(false);
      setSelectedCustomer(null);
      setCheckinForm({
        membership_type: '',
        room_type: '',
        room_number: ''
      });
      
      fetchActiveCheckins();
    } catch (error) {
      console.error('Error checking in customer:', error);
      alert(error.response?.data?.detail || 'Error checking in customer');
    }
    setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FLEX_LA</h1>
              <Badge variant="secondary" className="ml-3">
                {user?.role === 'manager' ? 'Manager' : 'Employee'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700">{user?.username}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Customer Management</TabsTrigger>
            <TabsTrigger value="active">Active Check-ins</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Customer Search
                </CardTitle>
                <CardDescription>
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
                      className="w-full"
                    />
                  </div>
                  <Button onClick={searchCustomers} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddCustomer(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {customers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {customer.first_name} {customer.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">ID: {customer.id_number}</p>
                            <p className="text-sm text-gray-600">DOB: {customer.date_of_birth}</p>
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

          <TabsContent value="active" className="space-y-6">
            {/* Active Check-ins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Active Check-ins ({activeCheckins.length})
                </CardTitle>
                <CardDescription>
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
                        className={`p-4 border rounded-lg ${checkin.is_overtime ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {checkin.customer?.first_name?.charAt(0)}{checkin.customer?.last_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {checkin.customer?.first_name} {checkin.customer?.last_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                              <div className={`font-semibold ${checkin.is_overtime ? 'text-red-600' : 'text-green-600'}`}>
                                {formatRemainingTime(checkin.remaining_hours)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Checked in: {new Date(checkin.check_in_time).toLocaleTimeString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={checkin.is_overtime ? "destructive" : "outline"}
                              onClick={() => handleCheckOut(checkin.id)}
                            >
                              Check Out
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter customer information to create a new profile
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addCustomer}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <Input
                placeholder="ID Number"
                value={customerForm.id_number}
                onChange={(e) => setCustomerForm({...customerForm, id_number: e.target.value})}
                required
              />
              <Input
                type="date"
                placeholder="Date of Birth"
                value={customerForm.date_of_birth}
                onChange={(e) => setCustomerForm({...customerForm, date_of_birth: e.target.value})}
                required
              />
              <Input
                type="date"
                placeholder="ID Expiration Date"
                value={customerForm.id_expiration_date}
                onChange={(e) => setCustomerForm({...customerForm, id_expiration_date: e.target.value})}
                required
              />
              <Input
                placeholder="State of ID"
                value={customerForm.state_of_id}
                onChange={(e) => setCustomerForm({...customerForm, state_of_id: e.target.value})}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddCustomer(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Add Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check In Customer</DialogTitle>
            <DialogDescription>
              {selectedCustomer && `Check in ${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckIn}>
            <div className="grid gap-4 py-4">
              <Select 
                value={checkinForm.membership_type} 
                onValueChange={(value) => setCheckinForm({...checkinForm, membership_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Membership Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_day">1-Day Pass ($10)</SelectItem>
                  <SelectItem value="6_month">6-Month Pass ($25)</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={checkinForm.room_type} 
                onValueChange={(value) => {
                  setCheckinForm({...checkinForm, room_type: value, room_number: ''});
                  fetchAvailableRooms(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Room Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locker">Locker ($25/$28)</SelectItem>
                  <SelectItem value="small_room">Small Room - No TV ($33/$36)</SelectItem>
                  <SelectItem value="regular_room">Regular Room - With TV ($40/$45)</SelectItem>
                  <SelectItem value="deluxe_room">Deluxe Room - With TV ($45/$50)</SelectItem>
                </SelectContent>
              </Select>

              {checkinForm.room_type && (
                <Select 
                  value={checkinForm.room_number} 
                  onValueChange={(value) => setCheckinForm({...checkinForm, room_number: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Room Number" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((roomNum) => (
                      <SelectItem key={roomNum} value={roomNum.toString()}>
                        Room #{roomNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCheckIn(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !checkinForm.room_number}>
                Check In
              </Button>
            </DialogFooter>
          </form>
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
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;