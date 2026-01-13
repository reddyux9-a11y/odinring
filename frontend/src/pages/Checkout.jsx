import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Check, ArrowLeft, Lock, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIdentityContext } from '../hooks/useIdentityContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { context: identityContext, refetch: refetchContext } = useIdentityContext();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Get plan from URL params
  const planId = searchParams.get('plan') || 'solo_standard';
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: user?.email || '',
    country: 'US',
    zipCode: ''
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const plans = {
    solo_standard: {
      id: 'solo_standard',
      name: 'Business Solo - Standard',
      price: 24,
      description: 'For solo businesses',
      features: [
        'Everything in Personal',
        'Advanced customization',
        'Advanced analytics',
        'Custom branding',
        'QR codes'
      ]
    },
    solo_enterprise: {
      id: 'solo_enterprise',
      name: 'Business Solo - Enterprise',
      price: 36,
      description: 'Enhanced features',
      features: [
        'Everything in Standard',
        'Priority support',
        'Enhanced features'
      ]
    },
    org: {
      id: 'org',
      name: 'Organization',
      price: 68,
      description: 'For teams and organizations',
      features: [
        'All Business Solo features',
        'Team Collaboration',
        'Multiple Departments',
        'Priority Support'
      ]
    }
  };

  const selectedPlan = plans[planId] || plans.solo_standard;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field, value) => {
    if (field === 'cardNumber') {
      setFormData(prev => ({ ...prev, [field]: formatCardNumber(value) }));
    } else if (field === 'expiryDate') {
      setFormData(prev => ({ ...prev, [field]: formatExpiryDate(value) }));
    } else if (field === 'cvv') {
      setFormData(prev => ({ ...prev, [field]: value.replace(/\D/g, '').substring(0, 3) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid card number');
      return false;
    }
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      toast.error('Please enter a valid expiry date');
      return false;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    if (!formData.cardName) {
      toast.error('Please enter the cardholder name');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    try {
      // Mock payment processing - simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful payment - in real app, this would be handled by payment gateway
      toast.success('Payment processed successfully! 🎉');
      
      // Call backend API to activate subscription
      try {
        const subscriptionResponse = await api.get('/billing/subscription');
        const subscriptionId = subscriptionResponse.data?.subscription?.id;

        if (subscriptionId) {
          const activateResponse = await api.post(
            `/billing/subscriptions/${subscriptionId}/activate`,
            { billing_cycle: 'yearly' }
          );

          const transactionId = activateResponse.data?.transaction_id || subscriptionId;
          await refetchContext();
          
          // Navigate to success page
          navigate(`/payment/success?plan=${selectedPlan.name}&transaction_id=${transactionId}`);
        } else {
          // Fallback to dashboard if no subscription found
          await refetchContext();
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error activating subscription:', error);
        // Still navigate to dashboard on error
        await refetchContext();
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      navigate(`/payment/failed?plan=${planId}&error=${encodeURIComponent(error.message || 'Payment processing failed')}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase to activate your subscription</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span className="font-medium">Yearly</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold">{formatPrice(selectedPlan.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Billed annually</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  This is a mock checkout. No real payment will be processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Expiry Date */}
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        maxLength={5}
                        required
                      />
                    </div>

                    {/* CVV */}
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={formData.cardName}
                      onChange={(e) => handleInputChange('cardName', e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="United States"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        required
                      />
                    </div>

                    {/* ZIP Code */}
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="12345"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Secure Checkout
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This is a mock checkout page for demonstration purposes. No real payment information is processed or stored.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Complete Purchase - {formatPrice(selectedPlan.price)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By completing this purchase, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

