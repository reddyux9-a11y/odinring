import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Input } from '../shared/ui/input';
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

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: '', email: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', { ...formData, subject: 'general' });
      setSubmitted(true);
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
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Customer Support</h1>
          <p className="text-muted-foreground">Onboarding help, activation guidance, and branding best practices</p>
        </motion.div>

        {/* Resources */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5" />
                Resources
              </CardTitle>
              <CardDescription>Guides and scripts to help you get the most out of OdinRing.</CardDescription>
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
                          Printable support document covering setup, activation, subscriptions, and personal branding/business use cases.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => window.open('/support/application-usage-guide.html', '_blank')}>
                          Open Guide <ExternalLink className="w-4 h-4 ml-2" />
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
                          Ready-to-record storyboard for: How to use, activate subscription, subscribe, and grow branding/business.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => window.open('/support/demo-video-script.md', '_blank')}>
                          Open Script <ExternalLink className="w-4 h-4 ml-2" />
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
                      <p>Need direct assistance? Contact support at <strong className="text-foreground">support@odinring.com</strong></p>
                      <p>Include your account email, issue summary, and screenshot for faster resolution.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Section — matches landing page style */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
          <div className="rounded-2xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' }}>
            {/* decorative circles */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* Left */}
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                We're here to help
              </p>
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                Have a question<br />or need support?
              </h2>
              <p className="mb-8 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Reach out about plans, features, ring activation, or anything else. We'll get back to you as soon as possible.
              </p>
              <div className="flex flex-col gap-3">
                {['Questions about plans, pricing, or features', 'Affiliate & partnership opportunities', 'Product feedback & suggestions', 'Support for ring activation or setup'].map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <span className="font-bold text-white mt-0.5">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — white form card */}
            <div className="relative z-10 bg-white rounded-2xl p-8 shadow-2xl">
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-purple-600" />
                  <p className="font-bold text-lg text-gray-900">Message sent!</p>
                  <p className="text-sm text-gray-500">We'll get back to you as soon as possible.</p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ full_name: '', email: '', comment: '' }); }}
                    className="mt-2 text-sm font-semibold text-purple-700 underline underline-offset-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Name</label>
                    <Input
                      placeholder="Your full name"
                      value={formData.full_name}
                      onChange={e => handleChange('full_name', e.target.value)}
                      required
                      className="bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      required
                      className="bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Comment</label>
                    <textarea
                      placeholder="Tell us more…"
                      rows={4}
                      value={formData.comment}
                      onChange={e => handleChange('comment', e.target.value)}
                      required
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none resize-y transition-colors focus:border-purple-500 placeholder:text-gray-400"
                      style={{ minHeight: '110px' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6d28d9,#4c1d95)', boxShadow: '0 6px 20px rgba(109,40,217,0.35)' }}
                  >
                    {submitting ? 'Sending…' : (<>Send <Send className="w-4 h-4" /></>)}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerSupport;
