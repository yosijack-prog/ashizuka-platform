const APPS = [
  {
    name: 'SmartUnit',
    url: 'http://localhost:5173',
    description: '受発注・配送管理',
    icon: '📦',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    name: 'Customer Order',
    url: 'http://localhost:5174',
    description: '顧客向け注文アプリ',
    icon: '🛒',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    name: 'Alcohol Search',
    url: 'http://localhost:5175',
    description: 'おいしいお酒検索システム',
    icon: '🍶',
    color: '#9333ea',
    bg: '#faf5ff',
    border: '#e9d5ff',
  },
  {
    name: 'Sales Manager',
    url: 'http://localhost:5176',
    description: '営業・社員管理システム',
    icon: '📊',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
];

export default function App() {
  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>🍾</span>
          <div>
            <h1 style={styles.title}>芦塚酒店</h1>
            <p style={styles.subtitle}>統合プラットフォーム</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <p style={styles.lead}>システムを選択してください</p>
        <div style={styles.grid}>
          {APPS.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.card, background: app.bg, borderColor: app.border, textDecoration: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
            >
              <span style={styles.icon}>{app.icon}</span>
              <h2 style={{ ...styles.appName, color: app.color }}>{app.name}</h2>
              <p style={styles.appDesc}>{app.description}</p>
              <span style={{ ...styles.badge, color: app.color, borderColor: app.border }}>
                {app.url.replace('http://', '')} →
              </span>
            </a>
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        <ApiStatus />
      </footer>
    </div>
  );
}

function ApiStatus() {
  const [status, setStatus] = React.useState<'checking' | 'ok' | 'error'>('checking');

  React.useEffect(() => {
    fetch('http://localhost:3001/health')
      .then((r) => r.json())
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  const dot = status === 'ok' ? '🟢' : status === 'error' ? '🔴' : '🟡';
  const label =
    status === 'ok' ? 'API サーバー 接続中' : status === 'error' ? 'API サーバー 未起動' : '確認中...';

  return (
    <span style={styles.apiStatus}>
      {dot} {label} &nbsp;|&nbsp; localhost:3001
    </span>
  );
}

import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#1e293b',
    color: '#fff',
    padding: '24px 32px',
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    maxWidth: 900,
    margin: '0 auto',
  },
  logo: { fontSize: 40 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '0.02em' },
  subtitle: { margin: '2px 0 0', fontSize: 13, color: '#94a3b8' },
  main: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    margin: '0 auto',
    padding: '48px 24px',
  },
  lead: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    marginBottom: 32,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 20px',
    borderRadius: 16,
    border: '1.5px solid',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    cursor: 'pointer',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  appName: { margin: '0 0 6px', fontSize: 18, fontWeight: 700 },
  appDesc: { margin: '0 0 16px', fontSize: 13, color: '#64748b', textAlign: 'center' },
  badge: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid',
    fontFamily: 'monospace',
  },
  footer: {
    padding: '16px 24px',
    textAlign: 'center',
    borderTop: '1px solid #e2e8f0',
    background: '#fff',
  },
  apiStatus: { fontSize: 13, color: '#64748b' },
};
