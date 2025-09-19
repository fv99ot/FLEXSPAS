import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Checkbox } from './components/ui/checkbox';
import { Alert, AlertDescription } from './components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://flexspa-app.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

const MembershipForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    id_expiration_date: '',
    state_of_id: ''
  });
  
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the terms and conditions to proceed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/customers/public`, formData);
      setSubmitted(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error submitting form. Please try again.');
    }
    
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center membership-form">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Application Submitted Successfully!</h2>
            <p className="text-gray-300 mb-4">
              Your membership application has been submitted and is pending staff approval. 
              Please proceed to the front desk when ready.
            </p>
            <div className="bg-yellow-600/20 p-4 rounded-lg border border-yellow-500/50 mb-4">
              <p className="text-yellow-200 font-semibold mb-2">📋 REMINDER:</p>
              <p className="text-yellow-200 text-sm">
                Please be ready to show your physical ID to staff for verification when you arrive at the front desk.
              </p>
            </div>
            <p className="text-sm text-gray-400">
              Reference ID: {formData.id_number}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg membership-form">
          <CardHeader className="text-center flex-button">
            <CardTitle className="text-4xl font-bold text-white flex-brand flex items-center justify-center">
              <div style={{ background: '#000000', padding: '12px', borderRadius: '8px' }}>
                <img 
                  src="https://customer-assets.emergentagent.com/job_bathhouse-admin/artifacts/vytho0m6_IMG_3221%202.jpg" 
                  alt="Flex Spa Los Angeles"
                  className="h-12 w-auto"
                  style={{ maxHeight: '48px', objectFit: 'contain' }}
                />
              </div>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Membership Registration Form
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="mb-6">
              <Alert className="bg-red-500/20 border-red-500/50 mb-4">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-50 font-medium">
                  <strong>IMPORTANT:</strong> You must have a valid, hard copy (physical) government-issued photo ID to complete registration. Digital copies or photos of IDs are not accepted.
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-blue-500/20 border-blue-500/50">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-50 font-medium">
                  Please fill out this form completely and accurately. All information is required for membership processing and must match your physical ID exactly.
                </AlertDescription>
              </Alert>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-red-600"
                    style={{ color: '#ffffff !important' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-red-600"
                    style={{ color: '#ffffff !important' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID Number *
                </label>
                <Input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleInputChange}
                  placeholder="Driver's License or State ID Number"
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-red-600"
                  style={{ color: '#ffffff !important' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <Input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-red-600"
                    style={{ color: '#ffffff !important' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ID Expiration Date *
                  </label>
                  <Input
                    type="date"
                    name="id_expiration_date"
                    value={formData.id_expiration_date}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-red-600"
                    style={{ color: '#ffffff !important' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State of ID *
                </label>
                <Input
                  type="text"
                  name="state_of_id"
                  value={formData.state_of_id}
                  onChange={handleInputChange}
                  placeholder="e.g., CA, NY, TX"
                  maxLength="2"
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-red-600"
                  style={{ color: '#ffffff !important' }}
                />
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-white/20">
                <h3 className="font-semibold text-white mb-3">
                  MEMBERSHIP AGREEMENT & LIABILITY WAIVER
                </h3>
                <div className="text-sm text-gray-300 space-y-3 max-h-64 overflow-y-auto">
                  <p>
                    I am fully aware that this is a gay men's private club, which promotes exclusively the social, political, spiritual, health and fitness requirements of our members in a non-threatening environment, and I am not offended by any homosexual activities. ALL persons who are NOT gay or bi-sexual are violating our rights to privacy, freedom to associate, to promote our minority-group's interests and we insist that you not patronize this establishment.
                  </p>
                  <p>
                    <strong>THIS IS A WAIVER OF ALL LIABILITY CLAIMS</strong>, whether personal body injury, real property damage or stolen property claims. For money/other consideration received. I AM RELEASING FLEXECO INC. AND ALL EMPLOYEES OF SAME OF/FROM ANY AND ALL RESPONSIBILITY OR LIABILITY CLAIMS OR LAWSUITS. I received $1 minimum for waiver. For H.I.V. testing schedule and condom availability please check postings throughout the club.
                  </p>
                  <p>
                    I have hereby been advised to consult an attorney and physician before joining, I understand and accept ALL of the conditions stated on both sides of this card and I agree to use these facilities at my own risk. I AGREE TO L.A. CO. HEALTH SAFE-SEX Practices Policy, and understand that the use of drugs and alcohol is strictly prohibited. I understand that failure to follow these rules will result in my suspension from the facility for a minimum of six months and a maximum of life.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreement"
                  checked={agreed}
                  onCheckedChange={setAgreed}
                  className="mt-1 border-white/20 data-[state=checked]:bg-red-600"
                />
                <label htmlFor="agreement" className="text-sm text-gray-300 cursor-pointer">
                  I have read, understood, and agree to all terms and conditions stated above. I acknowledge that I am at least 18 years of age and am entering this establishment voluntarily.
                </label>
              </div>

              {error && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading || !agreed}
                  className="flex-1 flex-button font-semibold py-3"
                >
                  {loading ? 'Submitting...' : 'Submit Membership Form'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Today's Date: {new Date().toLocaleDateString()}</p>
          <p className="mt-2">Questions? Please speak with staff at the front desk.</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipForm;