import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIdentityContext } from '../hooks/useIdentityContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SubscriptionIndex = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { context: identityContext } = useIdentityContext();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // Default to monthly

  const handleSkip = () => {
    // Mark subscription onboarding as skipped
    localStorage.setItem('subscription_onboarding_skipped', 'true');
    navigate('/dashboard');
  };

  const handleChoosePlan = (planId) => {
    // Pass billing cycle as query parameter
    navigate(`/checkout?plan=${planId}&billing=${billingCycle}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: price % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const plans = [
    {
      id: 'solo_standard',
      name: 'Standard',
      price: {
        monthly: 3.99,
        yearly: 43
      },
      description: 'For solo businesses',
      features: ['Unlimited links', 'Advanced customization', 'Advanced analytics', 'Custom branding', 'QR codes'],
      popular: true
    },
    {
      id: 'solo_enterprise',
      name: 'Enterprise',
      price: {
        monthly: 5.99,
        yearly: 64
      },
      description: 'Enhanced features',
      features: ['Everything in Standard', 'Priority support', 'Enhanced features'],
      popular: false
    },
    {
      id: 'org',
      name: 'Organization',
      price: {
        monthly: 10.99,
        yearly: 118
      },
      description: 'For teams and organizations',
      features: ['All Business Solo features', 'Team Collaboration', 'Multiple Departments', 'Priority Support'],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Choose the perfect plan for your business needs. 
            You can always upgrade or change your plan later.
          </p>
          
          {/* Billing Cycle Toggle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mt-4"
          >
            <ToggleGroup
              type="single"
              value={billingCycle}
              onValueChange={(value) => {
                if (value) setBillingCycle(value);
              }}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="monthly" aria-label="Monthly billing" className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-4">
                Monthly
              </ToggleGroupItem>
              <ToggleGroupItem value="yearly" aria-label="Yearly billing" className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-4">
                Yearly
              </ToggleGroupItem>
            </ToggleGroup>
          </motion.div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full flex flex-col ${plan.popular ? 'border-primary border-2 shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">
                        {plan.price[billingCycle] === 0 ? 'Free' : formatPrice(plan.price[billingCycle])}
                      </span>
                      {plan.price[billingCycle] > 0 && (
                        <>
                          <span className="text-muted-foreground ml-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                        </>
                      )}
                    </div>
                    {billingCycle === 'yearly' && plan.price[billingCycle] > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(plan.price.monthly * 12)}
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Save 10%
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleChoosePlan(plan.id)}
                    disabled={loading}
                  >
                    Choose {plan.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skip Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now, I'll choose later
          </Button>
        </motion.div>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto"
        >
          <p>
            All plans include a 14-day free trial. 
            You can upgrade or change your plan anytime from your dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionIndex;

