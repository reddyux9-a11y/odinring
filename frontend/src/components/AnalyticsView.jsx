import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import api from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Eye, MousePointer, Calendar as CalendarIcon, BarChart3, Globe, TrendingUp, Users, Zap, QrCode, Target, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, LineChart, Line } from "recharts";
import { getIconByName } from "../lib/iconMap";
import { cn } from "../lib/utils";
import { isMobileScreen } from "../utils/mobileUtils";
import { ChartSkeletonLoader } from "./SkeletonLoader";
import { Skeleton } from "./ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AnalyticsView = ({ links }) => {
  const [analytics, setAnalytics] = useState(null);
  const [qrAnalytics, setQrAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const totalClicksLocal = useMemo(() => links.reduce((sum, link) => sum + (link.clicks || 0), 0), [links]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileScreen());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when date picker is open on mobile
  useEffect(() => {
    if (isMobile && isDatePickerOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobile, isDatePickerOpen]);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Build query parameters for date range
        const params = {};
        if (dateRange.from) {
          params.start_date = format(dateRange.from, 'yyyy-MM-dd');
        }
        if (dateRange.to) {
          params.end_date = format(dateRange.to, 'yyyy-MM-dd');
        }
        
        // Fetch main analytics and QR analytics in parallel
        const [analyticsResponse, qrResponse] = await Promise.allSettled([
          api.get(`/analytics`, { params }),
          api.get(`/qr/analytics`)
        ]);
        
        if (isMounted) {
          if (analyticsResponse.status === 'fulfilled') {
            setAnalytics(analyticsResponse.value.data);
          }
          
          if (qrResponse.status === 'fulfilled') {
            setQrAnalytics(qrResponse.value.data);
          } else {
            // QR analytics might not exist yet, set default
            setQrAnalytics({ total_scans: 0 });
          }
        }
      } catch (err) {
        if (isMounted) setError("Failed to load analytics");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchAnalytics();
    return () => { isMounted = false; };
  }, [dateRange]);

  const totalVisits = analytics?.profile_views ?? 0;
  const totalClicks = analytics?.total_clicks ?? totalClicksLocal;
  
  // Calculate dynamic metrics
  const totalTaps = useMemo(() => qrAnalytics?.total_scans || 0, [qrAnalytics]);
  const engagement = useMemo(() => totalClicksLocal, [totalClicksLocal]);
  const performance = useMemo(() => {
    if (totalVisits === 0) return 0;
    return Math.round((totalClicksLocal / totalVisits) * 100);
  }, [totalClicksLocal, totalVisits]);
  const activeLinks = useMemo(() => links.filter(l => l.active).length, [links]);

  // Calculate top performing link (prefer backend top_link)
  const topLink = useMemo(() => {
    if (analytics?.top_link) return analytics.top_link;
    if (links.length === 0) return null;
    return links.reduce((maxLink, link) => (link.clicks > (maxLink?.clicks || 0) ? link : maxLink), links[0]);
  }, [analytics, links]);

  // Link performance list with percentages and icons
  const linkPerformance = useMemo(() => {
    if (analytics?.link_performance?.length) {
      const byId = new Map(links.map(l => [l.id, l]));
      return analytics.link_performance.map(item => ({
        ...item,
        icon: byId.get(item.id)?.icon || "Globe"
      }));
    }
    const total = totalClicksLocal || 0;
    return links
      .slice()
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .map(link => ({
        id: link.id,
        title: link.title,
        clicks: link.clicks || 0,
        percentage: total > 0 ? Math.round(((link.clicks || 0) / total) * 100) : 0,
        icon: link.icon || "Globe"
      }));
  }, [analytics, links, totalClicksLocal]);

  const weeklyData = analytics?.weekly_stats || [];

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
        <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-foreground font-medium capitalize">{p.name}</span>
            <span className="ml-auto font-semibold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24 sm:pb-8">
      {/* Key Metrics Grid - Commented out */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{totalTaps.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Taps</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Total taps</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{engagement.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Engagements</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Link interactions</div>
          </CardContent>
        </Card>

        {/* <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Clicks</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : 0}% click rate
            </div>
          </CardContent>
        </Card> */}

        {/* <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{totalVisits.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Views</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Last 7 days shown below</div>
          </CardContent>
        </Card>
      </div> */}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{performance}%</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Performance</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Click-through rate</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{activeLinks}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Links</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{links.length} total links</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-center text-muted-foreground space-x-3">
              <BarChart3 className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium">Loading analytics…</span>
            </div>
          </CardContent>
        </Card>
      )}
      {!!error && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center text-red-600 text-sm font-medium">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Link */}
      {/* {topLink && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Top Performing Link</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">Your most clicked link this period</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{topLink.title}</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                    #1
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 truncate">{topLink.url}</p>
                <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">{topLink.clicks} clicks</span>
                  {totalClicks > 0 && (
                    <span>{Math.round(((topLink.clicks || 0) / totalClicks) * 100)}% of total</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Link Performance */}
      {/* <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Link Performance</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">Click distribution across all your links</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {linkPerformance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MousePointer className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-xs sm:text-sm font-medium">No links to analyze yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add some links to see performance metrics</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600">Total Clicks</p>
                      <p className="text-lg font-bold text-blue-900">{totalClicksLocal}</p>
                    </div>
                    <MousePointer className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600">Avg per Link</p>
                      <p className="text-lg font-bold text-purple-900">
                        {linkPerformance.length > 0 ? Math.round(totalClicksLocal / linkPerformance.length) : 0}
                      </p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600">Performance</p>
                      <p className="text-lg font-bold text-green-900">{performance}%</p>
                    </div>
                    <Target className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-orange-600">Active Links</p>
                      <p className="text-lg font-bold text-orange-900">{activeLinks}</p>
                    </div>
                    <Zap className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="w-full bg-card rounded-xl border border-border p-4">
                <div className="mb-3">
                  <h4 className="text-lg font-semibold text-foreground mb-1">Link Performance</h4>
                  <p className="text-sm text-muted-foreground">Click distribution across your links</p>
                </div>

                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={linkPerformance.slice(0, 6)} margin={{ top: 10, right: 10, left: 5, bottom: 10 }}>
                      <defs>
                        <linearGradient id="areaPerfClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                          <stop offset="50%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="title"
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={5}
                        width={30}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        name="Clicks"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="url(#areaPerfClicks)"
                        dot={false}
                        activeDot={{
                          r: 6,
                          stroke: '#6366f1',
                          strokeWidth: 3,
                          fill: '#fff',
                          filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Weekly Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Weekly Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                {dateRange.from && dateRange.to 
                  ? `Activity from ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd')}`
                  : 'Smooth line chart for views and clicks (last 7 days)'}
              </CardDescription>
            </div>
            {isMobile ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                  onClick={() => setIsDatePickerOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd")
                    )
                  ) : (
                    <span>Select dates</span>
                  )}
                </Button>
                <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <DialogContent 
                    className="sm:max-w-[425px] max-h-[90vh] overflow-hidden p-0 rounded-t-2xl rounded-b-none sm:rounded-b-lg bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:left-[50%] sm:top-[50%] w-full sm:w-auto z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:data-[state=open]:slide-in-from-top sm:data-[state=closed]:slide-out-to-top"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                      e.preventDefault();
                    }}
                    onEscapeKeyDown={() => setIsDatePickerOpen(false)}
                  >
                    <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
                      <DialogTitle className="text-center text-lg font-semibold">Select Date Range</DialogTitle>
                    </DialogHeader>
                    <div className="px-4 sm:px-6 pb-4 pt-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                      <div className="flex justify-center w-full">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from || new Date()}
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => {
                            setDateRange(range || { from: null, to: null });
                            if (range?.from && range?.to) {
                              setTimeout(() => setIsDatePickerOpen(false), 100);
                            }
                          }}
                          numberOfMonths={1}
                          className="p-2 w-full"
                        />
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-background">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setDateRange({ from: null, to: null });
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Clear Filter
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Dynamic Weekly Summary Boxes */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-lg p-3 border border-border animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                      <Skeleton className="h-4 w-4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Taps</p>
                      <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{totalTaps}</p>
                    </div>
                    <QrCode className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Engagements</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{engagement}</p>
                    </div>
                    <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg p-3 border border-purple-100 dark:border-purple-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Performance</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{performance}%</p>
                    </div>
                    <Target className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg p-3 border border-orange-100 dark:border-orange-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Active Links</p>
                      <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{activeLinks}</p>
                    </div>
                    <Zap className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Premium Area Chart */}
            <div className="w-full bg-card rounded-xl border border-border p-4">
              <div className="mb-3">
                <h4 className="text-lg font-semibold text-foreground mb-1">Taps Over 7 Days</h4>
                <p className="text-sm text-muted-foreground">Weekly activity trends</p>
              </div>
              
              {isLoading ? (
                <ChartSkeletonLoader height="h-64 sm:h-80" />
              ) : (
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 5, bottom: 10 }}>
                      <defs>
                        <linearGradient id="areaTaps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                          <stop offset="50%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={5}
                        width={30}
                      />
                      <Tooltip 
                        content={<ChartTooltip />}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="visits" 
                        name="Taps" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        fill="url(#areaTaps)" 
                        dot={false}
                        activeDot={{ 
                          r: 6, 
                          stroke: '#6366f1', 
                          strokeWidth: 3, 
                          fill: '#fff',
                          filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
                        }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;