'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kfyhljqanxunrnnvnftc.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Company {
  id: number;
  cid: string;
  company_name: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  job_count: number | null;
  status: string;
  scraped_at: string | null;
}

interface Stats {
  total: number;
  completed: number;
  errors: number;
  notFound: number;
}

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, errors: 0, notFound: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOnlyFound, setShowOnlyFound] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchData();
    const interval = setInterval(() => {
      fetchStats();
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [showOnlyFound]);

  async function fetchStats() {
    // Get accurate counts from Supabase
    const { count: total } = await supabase
      .from('adp_clients')
      .select('*', { count: 'exact', head: true });

    const { count: completed } = await supabase
      .from('adp_clients')
      .select('*', { count: 'exact', head: true })
      .not('company_name', 'is', null)
      .neq('company_name', '');

    const { count: errors } = await supabase
      .from('adp_clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');

    const { count: notFound } = await supabase
      .from('adp_clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'not_found');

    setStats({
      total: total || 0,
      completed: completed || 0,
      errors: errors || 0,
      notFound: notFound || 0
    });
  }

  async function fetchData() {
    let query = supabase
      .from('adp_clients')
      .select('*')
      .order('company_name', { ascending: true, nullsFirst: false });

    if (showOnlyFound) {
      query = query.not('company_name', 'is', null).neq('company_name', '');
    }

    const { data } = await query.limit(500);

    if (data) {
      setCompanies(data);
    }
    setLoading(false);
  }

  async function exportCSV() {
    // Export ALL found companies, not just displayed ones
    const { data } = await supabase
      .from('adp_clients')
      .select('*')
      .not('company_name', 'is', null)
      .neq('company_name', '')
      .order('company_name', { ascending: true });

    if (!data) return;

    const headers = ['company_name', 'website', 'location', 'industry', 'job_count', 'cid'];
    const csv = [
      headers.join(','),
      ...data.map(c => 
        headers.map(h => `"${(c[h as keyof Company] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adp_clients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filtered = companies.filter(c => 
    !search || 
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase()) ||
    c.cid?.toLowerCase().includes(search.toLowerCase())
  );

  const pctComplete = stats.total > 0 ? (stats.completed / stats.total * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <h1 className="text-2xl font-bold">📊 ADP Client Research</h1>
        <p className="text-indigo-200">Calibrate HCM Prospecting Database</p>
      </header>

      <div className="bg-gray-800 p-6 flex flex-wrap gap-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">{stats.completed.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase">Companies Found</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-400">{stats.total.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase">Total Records</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-400">{stats.errors.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase">Errors</div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all"
              style={{ width: `${pctComplete.toFixed(1)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {pctComplete.toFixed(1)}% have company data
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-wrap gap-4 items-center border-b border-gray-700">
        <input
          type="text"
          placeholder="Search companies..."
          className="flex-1 max-w-md bg-gray-800 border border-gray-600 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyFound}
            onChange={(e) => setShowOnlyFound(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show only found</span>
        </label>
        <button 
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          📥 Export All ({stats.completed.toLocaleString()})
        </button>
        <button 
          onClick={() => { fetchStats(); fetchData(); }}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Website</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Industry</th>
              <th className="px-4 py-3 text-left">Jobs</th>
              <th className="px-4 py-3 text-left">CID</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No results found</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-indigo-400">{c.company_name || '—'}</td>
                <td className="px-4 py-3">
                  {c.website ? (
                    <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" className="text-blue-400 hover:underline">
                      {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 30)}
                    </a>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-300">{c.location || '—'}</td>
                <td className="px-4 py-3 text-gray-300">{c.industry || '—'}</td>
                <td className="px-4 py-3">
                  {c.job_count ? (
                    <span className="bg-indigo-600 px-2 py-1 rounded text-xs">{c.job_count}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {c.cid?.substring(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  {c.company_name ? (
                    <span className="text-green-400">✓ Found</span>
                  ) : c.status === 'error' ? (
                    <span className="text-red-400">✗ Error</span>
                  ) : (
                    <span className="text-gray-500">{c.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length >= 500 && (
          <div className="p-4 text-center text-gray-400 text-sm">
            Showing first 500 results. Use search to filter or export all data.
          </div>
        )}
      </div>
    </div>
  );
}
