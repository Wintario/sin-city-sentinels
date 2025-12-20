import { useState, useEffect } from 'react';
import { statsAPI, StatsOverview, NewsViewStats, PageVisitStats } from '@/lib/api';
import { Eye, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const StatsAdmin = () => {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [newsViews, setNewsViews] = useState<NewsViewStats[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisitStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'topnews' | 'visits'>('overview');

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [overviewData, newsViewsData, pageVisitsData] = await Promise.all([
        statsAPI.getOverview(),
        statsAPI.getNewsViews(),
        statsAPI.getPageVisits(),
      ]);
      
      setOverview(overviewData);
      setNewsViews(newsViewsData);
      setPageVisits(pageVisitsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Oshibka zagruzki statistiki');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12": 