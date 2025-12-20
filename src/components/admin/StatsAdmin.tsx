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
      toast.error('Error loading statistics');
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Site Statistics
        </h2>
        <button
          onClick={loadStats}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('topnews')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'topnews' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Top 10 News
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'visits' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Page Visits
        </button>
      </div>

      {activeTab === 'overview' && overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="text-sm text-muted-foreground">Total Views</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {overview.total_news_views.toLocaleString('ru-RU')}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-sm text-muted-foreground">Page Visits</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {overview.total_page_views.toLocaleString('ru-RU')}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-sm text-muted-foreground">Unique Days</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {overview.unique_days}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="text-sm text-muted-foreground">Last View</h3>
            </div>
            <p className="text-sm font-medium text-foreground truncate">
              {overview.last_view ? formatDate(overview.last_view) : 'No data'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'topnews' && (
        <div className="space-y-2">
          {newsViews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No view data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Title</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Views</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">7 Days</th>
                  </tr>
                </thead>
                <tbody>
                  {newsViews.map((item, index) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className="hover:text-primary transition-colors truncate block">
                          {item.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                          <Eye className="w-3 h-3" />
                          {item.views_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.recent_views_7days}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="space-y-2">
          {pageVisits.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No visit data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Page Type</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Visits</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {pageVisits.map((item, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {new Date(item.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.page_type === 'news' && 'News'}
                        {item.page_type === 'home' && 'Home'}
                        {item.page_type === 'members' && 'Members'}
                        {item.page_type === 'other' && 'Other'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{item.visits}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.unique_visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsAdmin;