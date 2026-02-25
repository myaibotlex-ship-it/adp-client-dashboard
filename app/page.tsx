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

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, jobs: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from('adp_clients')
      .select('*')
      .order('id', { ascending: true })
      .limit(1000);

    if (data) {
      setCompanies(data);
      setStats({
        total: 7069,
        completed: data.filter(c => c.company_name).length,
        jobs: data.reduce((sum, c) => sum + (c.job_count || 0), 0)
      });
    }
    setLoading(false);
  }

  function exportCSV() {
    const headers = ['company_name', 'website', 'location', 'industry', 'job_count', 'cid'];
    const csv = [
      headers.join(','),
      ...companies.filter(c => c.company_name).map(c => 
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
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <h1 className="text-2xl font-bold">📊 ADP Client Research</h1>
        <p className="text-indigo-200">Calibrate HCM Prospecting Database</p>
      </header>

      <div className="bg-gray-800 p-6 flex gap-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-indigo-400">{stats.completed}</div>
          <div className="text-xs text-gray-400 uppercase">Companies Found</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">{stats.jobs.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase">Total Jobs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400">{stats.total - stats.completed}</div>
          <div className="text-xs text-gray-400 uppercase">Remaining</div>
        </div>
        <div className="flex-1">
          <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all"
              style={{ width: `${(stats.completed / stats.total * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {(stats.completed / stats.total * 100).toFixed(1)}% Complete
          </div>
        </div>
      </div>

      <div className="p-4 flex gap-4 items-center border-b border-gray-700">
        <input
          type="text"
          placeholder="Search companies..."
          className="flex-1 max-w-md bg-gray-800 border border-gray-600 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button 
          onClick={exportCSV}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
        >
          📥 Export CSV
        </button>
        <button 
          onClick={fetchData}
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
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-indigo-400">{c.company_name || '—'}</td>
                <td className="px-4 py-3">
                  {c.website ? (
                    <a href={c.website} target="_blank" className="text-blue-400 hover:underline">
                      {new URL(c.website).hostname}
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
                <td className="px-4 py-3">
                  {c.company_name ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-yellow-400">⏳</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
