import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  LifeBuoy,
  FileText,
  PlayCircle,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerSupport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold mb-2">Customer Support</h1>
          <p className="text-muted-foreground">
            Onboarding help, activation guidance, and branding best practices
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5" />
                Resources
              </CardTitle>
              <CardDescription>
                Guides and scripts to help you get the most out of OdinRing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 mt-0.5 text-primary" />
                      <div className="space-y-2">
                        <p className="font-semibold">Application Usage Guide</p>
                        <p className="text-sm text-muted-foreground">
                          Printable support document covering setup, activation, subscriptions,
                          and personal branding/business use cases.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/support/application-usage-guide.html', '_blank')}
                        >
                          Open Guide
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <PlayCircle className="w-5 h-5 mt-0.5 text-primary" />
                      <div className="space-y-2">
                        <p className="font-semibold">Demo Video Script</p>
                        <p className="text-sm text-muted-foreground">
                          Ready-to-record storyboard for: How to use, activate subscription,
                          subscribe, and grow branding/business.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/support/demo-video-script.md', '_blank')}
                        >
                          Open Script
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Need direct assistance? Contact support at{' '}
                        <strong className="text-foreground">support@odinring.com</strong>
                      </p>
                      <p>
                        Include your account email, issue summary, and screenshot for faster resolution.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerSupport;
