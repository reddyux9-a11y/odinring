import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { AlertCircle, ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '../shared/ui/alert';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorMessage = searchParams.get('error') || 'Payment processing failed';
  const planId = searchParams.get('plan');

  const handleRetry = () => {
    if (planId) {
      navigate(`/checkout?plan=${planId}`);
    } else {
      navigate('/billing/choose-plan');
    }
  };

  const handleGoBack = () => {
    navigate('/billing/choose-plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-red-200 dark:border-red-800 bg-card">
          <CardHeader className="text-center space-y-4 pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
            >
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </motion.div>
            
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Payment Failed
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                We couldn't process your payment
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Processing Error</AlertTitle>
              <AlertDescription className="mt-2">
                {errorMessage}
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm mb-2">Common reasons for payment failure:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Insufficient funds or card limit reached</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Card details entered incorrectly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Card expired or blocked by bank</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Network or connection issues</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Try Payment Again
              </Button>

              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Choose a Different Plan
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-center text-xs text-muted-foreground">
                Need help? Contact our support team or try a different payment method.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentFailed;







