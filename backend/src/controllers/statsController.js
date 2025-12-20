import { getDatabase } from '../db/db.js';

const db = getDatabase();

// Track news view
export const trackNewsView = (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Increment views_count in news table
    db.prepare(
      'UPDATE news SET views_count = views_count + 1 WHERE id = ?'
    ).run(id);

    // Log page view
    db.prepare(
      'INSERT INTO page_views (page_type, page_id, ip_address, user_agent) VALUES (?, ?, ?, ?)'
    ).run('news', id, ip, userAgent);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in trackNewsView:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
};

// Get statistics overview
export const getStatsOverview = (req, res) => {
  try {
    const result = db.prepare(
      `SELECT 
        COALESCE(COUNT(DISTINCT page_id), 0) as total_news_views,
        COALESCE(COUNT(*), 0) as total_page_views,
        COALESCE(COUNT(DISTINCT DATE(viewed_at)), 0) as unique_days,
        MAX(viewed_at) as last_view
      FROM page_views
      WHERE page_type = 'news'`
    ).get();
    
    res.json(result || {});
  } catch (error) {
    console.error('Error in getStatsOverview:', error);
    res.status(500).json({ error: 'Failed to get stats overview' });
  }
};

// Get news views ranking
export const getNewsViews = (req, res) => {
  try {
    const results = db.prepare(
      `SELECT 
        n.id,
        n.title,
        n.views_count,
        COALESCE(COUNT(pv.id), 0) as recent_views_7days
      FROM news n
      LEFT JOIN page_views pv ON pv.page_id = n.id 
        AND pv.page_type = 'news'
        AND pv.viewed_at >= datetime('now', '-7 days')
      WHERE n.is_deleted = 0
      GROUP BY n.id
      ORDER BY n.views_count DESC
      LIMIT 10`
    ).all();
    
    res.json(results || []);
  } catch (error) {
    console.error('Error in getNewsViews:', error);
    res.status(500).json({ error: 'Failed to get news views' });
  }
};

// Get page visits by date
export const getPageVisits = (req, res) => {
  try {
    const results = db.prepare(
      `SELECT 
        DATE(viewed_at) as date,
        page_type,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM page_views
      WHERE viewed_at >= datetime('now', '-30 days')
      GROUP BY DATE(viewed_at), page_type
      ORDER BY date DESC`
    ).all();
    
    res.json(results || []);
  } catch (error) {
    console.error('Error in getPageVisits:', error);
    res.status(500).json({ error: 'Failed to get page visits' });
  }
};
