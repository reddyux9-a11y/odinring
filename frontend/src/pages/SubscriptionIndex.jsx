import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Badge } from '../shared/ui/badge';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  'Smart business profile with custom link',
  'Custom brand logo, colours & fonts',
  'Digital product & service catalog',
  'Media hub — photos, videos, documents',
  'WhatsApp direct contact button',
  'Social media links & distribution',
  'Real-time analytics dashboard',
  'Free QR code generator',
  'Whats app, Email, Website,',
];

const BILLING_OPTIONS = [
  {
    id: 'monthly',
    label: 'Monthly Plan',
    badgeClass: 'bg-purple-500 text-white',
    price: 1.99,
    suffix: '/ month',
    note: 'save more with monthly billing',
  },
  {
    id: 'quarterly',
    label: 'Quarterly Plan',
    badgeClass: 'bg-blue-400 text-white',
    price: 11.99,
    suffix: '/ 3-months',
    note: 'save more with annual billing',
  },
  {
    id: 'yearly',
    label: 'Annual Plan',
    badgeClass: 'bg-yellow-400 text-gray-900',
    price: 47.99,
    suffix: '/ year',
    note: 'save more with annual billing',
  },
];

const SubscriptionIndex = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSkip = () => {
    localStorage.setItem('subscription_onboarding_skipped', 'true');
    navigate('/dashboard');
  };

  const handleChoosePlan = (billingCycle) => {
    navigate(`/checkout?plan=pro&billing=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase mb-4">
            — Simple, Honest Pricing
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-4">
            Less than your morning coffee.<br />
            More powerful than a website.
          </h1>
          <p className="text-gray-500 text-base">
            One flat price. No hidden fees. No hosting. No domain. No developer.
          </p>
        </motion.div>

        {/* Billing cycle cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {BILLING_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative h-full flex flex-col border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 pt-6 px-6">
                  <div className="mb-4">
                    <Badge className={`${option.badgeClass} rounded-full px-3 py-1 text-xs font-semibold`}>
                      {option.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Everything you need to grow
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-2xl font-bold text-gray-800">€</span>
                    <span className="text-5xl font-black text-gray-900 leading-none">
                      {option.price.toFixed(2).split('.')[0]}
                    </span>
                    <span className="text-2xl font-bold text-gray-800 mb-1">
                      .{option.price.toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {option.suffix} · {option.note}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col px-6 pb-6">
                  <ul className="space-y-2 mb-6 flex-1">
                    {FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold"
                    onClick={() => handleChoosePlan(option.id)}
                    disabled={loading}
                  >
                    Start Free — No Card Required →
                  </Button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Cancel any time · No long-term contracts · Your data always stays yours
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skip */}
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
      </div>
    </div>
  );
};

export default SubscriptionIndex;
