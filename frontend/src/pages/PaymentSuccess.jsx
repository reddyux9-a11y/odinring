import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIdentityContext } from '../hooks/useIdentityContext';
import api from '../lib/api';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 10; // ~25 seconds total

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchContext } = useIdentityContext();
  const [confirmed, setConfirmed] = useState(false);
  const pollCountRef = useRef(0);

  const planName = searchParams.get('plan') || 'your plan';
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let timer;

    const activate = async () => {
      // First, try direct Stripe session verification (immediate, no webhook wait)
      if (sessionId) {
        try {
          const res = await api.get(`/billing/verify-checkout?session_id=${sessionId}`);
          if (res.data?.activated || res.data?.already_active) {
            await refetchContext();
            setConfirmed(true);
            return;
          }
        } catch {
          // Fall through to polling
        }
      }

      // Fall back to polling /me/context (webhook may have already fired)
      const poll = async () => {
        const ctx = await refetchContext();
        const status = ctx?.subscription?.status;
        if (status === 'active') {
          setConfirmed(true);
          return;
        }
        pollCountRef.current += 1;
        if (pollCountRef.current < MAX_POLLS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          // Give up polling; assume success (webhook may be delayed)
          setConfirmed(true);
        }
      };

      poll();
    };

    activate();
    return () => clearTimeout(timer);
  }, []);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-green-200 dark:border-green-800 bg-card">
          <CardHeader className="text-center space-y-4 pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
            >
              {confirmed
                ? <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                : <Loader2 className="w-12 h-12 text-green-600 dark:text-green-400 animate-spin" />
              }
            </motion.div>

            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {confirmed ? 'Payment Successful! 🎉' : 'Confirming Payment…'}
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {confirmed
                  ? 'Your subscription has been activated'
                  : 'Please wait while we confirm your payment with Stripe'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-semibold">{planName}</span>
              </div>

              {sessionId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Session ID</span>
                  <span className="font-mono text-xs text-muted-foreground">{sessionId.slice(0, 20)}…</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {confirmed
                  ? <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </span>
                  : <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming…
                    </span>
                }
              </div>
            </div>

            {confirmed && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                      You're all set!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your subscription is now active. You have full access to all premium features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGoToDashboard}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              size="lg"
              disabled={!confirmed}
            >
              {confirmed
                ? <><span>Go to Dashboard</span><ArrowRight className="w-4 h-4 ml-2" /></>
                : <><Loader2 className="w-4 h-4 mr-2 animate-spin" /><span>Activating subscription…</span></>
              }
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;







