import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Input } from '../shared/ui/input';
import { Label } from '../shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shared/ui/select';
import {
  ArrowLeft,
  ExternalLink,
  LifeBuoy,
  FileText,
  PlayCircle,
  MessageCircle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';

const SUBJECT_OPTIONS = [
  { value: 'sells', label: 'Sales' },
  { value: 'affiliate', label: 'Affiliate & Partnerships' },
  { value: 'products', label: 'Products' },
  { value: 'complains', label: 'Complaints' },
  { value: 'suggestions', label: 'Suggestions' },
  { value: 'support', label: 'Ring Activation / Setup Support' },
];

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: '', email: '', subject: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) {
      toast.error('Please select a subject.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/contact', formData);
      setSubmitted(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Have a question or feedback? Fill out the form below and we'll get back to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <p className="font-semibold text-lg">Message sent!</p>
                  <p className="text-sm text-muted-foreground">We'll get back to you as soon as possible.</p>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ full_name: '', email: '', subject: '', comment: '' }); }}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cs_name">Full Name</Label>
                      <Input
                        id="cs_name"
                        placeholder="Your full name"
                        value={formData.full_name}
                        onChange={e => handleChange('full_name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cs_email">Email</Label>
                      <Input
                        id="cs_email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cs_subject">Subject</Label>
                    <Select value={formData.subject} onValueChange={val => handleChange('subject', val)}>
                      <SelectTrigger id="cs_subject">
                        <SelectValue placeholder="Select a topic…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cs_comment">Message</Label>
                    <textarea
                      id="cs_comment"
                      placeholder="Tell us more…"
                      rows={4}
                      value={formData.comment}
                      onChange={e => handleChange('comment', e.target.value)}
                      required
                      className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerSupport;
