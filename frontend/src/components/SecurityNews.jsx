import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, User, ShieldAlert } from 'lucide-react';

export default function SecurityNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/news');
        const data = await response.json();
        setNews(data);
      } catch (err) {
        console.error('Failed to fetch security news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000); // Update every 10 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="news-panel-loading">
        <div className="news-skeleton" />
        <div className="news-skeleton" />
        <div className="news-skeleton" />
      </div>
    );
  }

  return (
    <div className="monitor-panel news-panel">
      <div className="monitor-panel-header">
        <h3><Newspaper size={14} style={{ color: 'var(--accent-cyan)' }} /> Global Threat Intelligence</h3>
        <span className="monitor-live-badge">● LIVE FEED</span>
      </div>
      
      <div className="news-list">
        {news.map((item, i) => (
          <a 
            key={i} 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="news-item"
          >
            <div className="news-content">
              <div className="news-title">
                {item.title}
                <ExternalLink size={12} className="news-link-icon" />
              </div>
              <div className="news-meta">
                <span><Clock size={10} /> {new Date(item.date).toLocaleDateString()}</span>
                {item.author && <span><User size={10} /> {item.author}</span>}
              </div>
              <p className="news-snippet">{item.content?.substring(0, 120)}...</p>
            </div>
          </a>
        ))}
      </div>

      <style jsx>{`
        .news-panel {
          grid-column: span 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .news-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .news-item {
          display: block;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }
        .news-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-cyan);
          transform: translateY(-2px);
        }
        .news-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-bright);
          margin-bottom: 6px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          line-height: 1.3;
        }
        .news-link-icon {
          opacity: 0.4;
          flex-shrink: 0;
          margin-top: 3px;
        }
        .news-meta {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 8px;
          align-items: center;
        }
        .news-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .news-snippet {
          font-size: 0.8rem;
          color: var(--text-dim);
          line-height: 1.4;
          margin: 0;
        }
        .news-panel-loading {
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .news-skeleton {
          height: 80px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
