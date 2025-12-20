import { db } from '../db/db.js';

// Track news view
export const trackNewsView = (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Increment views_count in news table
    db.run(
      'UPDATE news SET views_count = views_count + 1 WHERE id = ?',
      [id],
      (err) => {
        if (err) {
          console.error('Error updating views count:', err);
        }
      }
    );

    // Log page view
    db.run(
      'INSERT INTO page_views (page_type, page_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      ['news', id, ip, userAgent],
      (err) => {
        if (err) {
          console.error('Error logging page view:', err);
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error in trackNewsView:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
};

// Get statistics overview
export const getStatsOverview = (req, res) => {
  try {
    db.all(
      `SELECT 
        COUNT(DISTINCT page_id) as total_news_views,
        COUNT(*) as total_page_views,
        COUNT(DISTINCT DATE(viewed_at)) as unique_days,
        MAX(viewed_at) as last_view
      FROM page_views
      WHERE page_type = 'news'`,
      (err, rows) => {
        if (err) {
          console.error('Error getting stats overview:', err);
          return res.status(500).json({ error: 'Failed to get stats' });
        }
        res.json(rows[0] || {});
      }
    );
  } catch (error) {
    console.error('Error in getStatsOverview:', error);
    res.status(500).json({ error: 'Failed to get stats overview' });
  }
};

// Get news views ranking
export const getNewsViews = (req, res) => {
  try {
    db.all(
      `SELECT 
        n.id,
        n.title,
        n.views_count,
        COUNT(pv.id) as recent_views_7days
      FROM news n
      LEFT JOIN page_views pv ON pv.page_id = n.id 
        AND pv.page_type = 'news'
        AND pv.viewed_at >= datetime('now', '-7 days')
      WHERE n.is_deleted = 0
      GROUP BY n.id
      ORDER BY n.views_count DESC
      LIMIT 10`,
      (err, rows) => {
        if (err) {
          console.error('Error getting news views:', err);
          return res.status(500).json({ error: 'Failed to get news views' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error in getNewsViews:', error);
    res.status(500).json({ error: 'Failed to get news views' });
  }
};

// Get page visits by date
export const getPageVisits = (req, res) => {
  try {
    db.all(
      `SELECT 
        DATE(viewed_at) as date,
        page_type,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM page_views
      WHERE viewed_at >= datetime('now', '-30 days')
      GROUP BY DATE(viewed_at), page_type
      ORDER BY date DESC`,
      (err, rows) => {
        if (err) {
          console.error('Error getting page visits:', err);
          return res.status(500).json({ error: 'Failed to get page visits' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error in getPageVisits:', error);
    res.status(500).json({ error: 'Failed to get page visits' });
  }
};
