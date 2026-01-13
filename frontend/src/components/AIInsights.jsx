import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Clock,
  Users,
  LinkIcon,
  Sparkles,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

const AIInsights = ({ links = [], analytics = {} }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizationScore, setOptimizationScore] = useState(0);

  useEffect(() => {
    // Simulate AI analysis
    generateAIInsights();
  }, [links, analytics]);

  const generateAIInsights = () => {
    setLoading(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const aiInsights = [
        {
          id: 1,
          type: "optimization",
          priority: "high",
          title: "Link Performance Optimization",
          description: "Your 'Portfolio' link has 34% higher engagement when placed first. Consider reordering.",
          impact: "Potential 23% increase in clicks",
          action: "Reorder links",
          icon: TrendingUp,
          color: "green"
        },
        {
          id: 2,
          type: "timing",
          priority: "medium",
          title: "Peak Engagement Hours",
          description: "Your links receive 67% more engagement between 2-4 PM on weekdays.",
          impact: "Schedule important announcements",
          action: "Use smart scheduling",
          icon: Clock,
          color: "blue"
        },
        {
          id: 3,
          type: "content",
          priority: "high",
          title: "Link Title Optimization",
          description: "Links with action words ('Get', 'Download', 'Join') perform 45% better.",
          impact: "Improve conversion rates",
          action: "Update link titles",
          icon: Target,
          color: "purple"
        },
        {
          id: 4,
          type: "design",
          priority: "medium",
          title: "Visual Hierarchy Enhancement",
          description: "Using gradient styles for your top 3 links could increase visibility by 28%.",
          impact: "Better visual hierarchy",
          action: "Apply style suggestions",
          icon: Sparkles,
          color: "pink"
        },
        {
          id: 5,
          type: "social",
          priority: "low",
          title: "Social Proof Opportunity",
          description: "Adding view/click counts to links increases trust and engagement by 15%.",
          impact: "Increase user confidence",
          action: "Enable social proof",
          icon: Users,
          color: "orange"
        }
      ];

      setInsights(aiInsights);
      
      // Calculate optimization score based on various factors
      const activeLinks = links.filter(link => link.active).length;
      const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
      const avgClicksPerLink = activeLinks > 0 ? totalClicks / activeLinks : 0;
      
      let score = 40; // Base score
      
      // Bonus points for various factors
      if (activeLinks >= 5) score += 20;
      if (avgClicksPerLink > 10) score += 15;
      if (links.some(link => link.description)) score += 10;
      if (links.some(link => link.style !== 'default')) score += 10;
      if (activeLinks <= 8) score += 5; // Not too many links
      
      setOptimizationScore(Math.min(score, 100));
      setLoading(false);
    }, 2000);
  };

  const handleApplyInsight = (insight) => {
    toast.success(`Applied AI suggestion: ${insight.action}`);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getIconColor = (color) => {
    const colors = {
      green: "text-green-600 bg-green-100",
      blue: "text-blue-600 bg-blue-100",
      purple: "text-purple-600 bg-purple-100",
      pink: "text-pink-600 bg-pink-100",
      orange: "text-orange-600 bg-orange-100"
    };
    return colors[color] || "text-gray-600 bg-gray-100";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <CardTitle>AI Insights</CardTitle>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            <CardDescription>
              Our AI is analyzing your profile performance...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-600">Analyzing your profile...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            AI Insights
            <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </h1>
          <p className="text-gray-600 mt-1">Smart recommendations to optimize your profile</p>
        </div>
        <Button
          variant="outline"
          onClick={generateAIInsights}
          className="hover:bg-purple-50 hover:border-purple-300"
        >
          <Brain className="w-4 h-4 mr-2" />
          Re-analyze
        </Button>
      </div>

      {/* Optimization Score */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Profile Optimization Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(optimizationScore)}`}>
                {optimizationScore}%
              </div>
              <div className="text-sm text-gray-600">
                {getScoreLabel(optimizationScore)}
              </div>
            </div>
            <div>
              <div className="text-2xl">
                {optimizationScore >= 80 ? <TrendingUp className="w-8 h-8 text-green-500" /> : 
                 optimizationScore >= 60 ? <Target className="w-8 h-8 text-yellow-500" /> : 
                 <AlertTriangle className="w-8 h-8 text-red-500" />}
              </div>
            </div>
          </div>
          
          <Progress value={optimizationScore} className="mb-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{links.filter(l => l.active).length}</div>
              <div className="text-xs text-gray-600">Active Links</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {links.reduce((sum, link) => sum + (link.clicks || 0), 0)}
              </div>
              <div className="text-xs text-gray-600">Total Clicks</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {links.filter(l => l.style !== 'default').length}
              </div>
              <div className="text-xs text-gray-600">Styled Links</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {insights.filter(i => i.priority === 'high').length}
              </div>
              <div className="text-xs text-gray-600">High Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <div className="grid md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(insight.color)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <Badge variant="outline" className={`text-xs mt-1 ${getPriorityColor(insight.priority)}`}>
                          {insight.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-3">{insight.description}</p>
                  
                  <div className="flex items-center text-sm text-green-600 mb-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="font-medium">{insight.impact}</span>
                  </div>
                  
                  <Button
                    size="sm" 
                    onClick={() => handleApplyInsight(insight)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {insight.action}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            Quick Optimization Actions
          </CardTitle>
          <CardDescription>
            One-click improvements based on AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <Target className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Optimize Order</div>
                <div className="text-xs text-gray-600">AI-powered link ranking</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-green-50 hover:border-green-300"
            >
              <Sparkles className="w-6 h-6 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Auto-Style</div>
                <div className="text-xs text-gray-600">Apply best-performing styles</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
            >
              <Brain className="w-6 h-6 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">Smart Titles</div>
                <div className="text-xs text-gray-600">AI-generated improvements</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            AI-detected patterns in your profile engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Engagement Rising</div>
                  <div className="text-sm text-green-700">+24% increase this week</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-green-600" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Peak Hours Identified</div>
                  <div className="text-sm text-blue-700">2-4 PM weekdays are optimal</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-900">Underperforming Link</div>
                  <div className="text-sm text-orange-700">'Contact' link needs attention</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;