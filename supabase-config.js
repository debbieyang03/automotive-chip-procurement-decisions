// Supabase 配置文件
// 請替換為您的實際 Supabase 憑證
// 從 https://app.supabase.com → Project Settings → API 獲取

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

// 創建簡單的 Supabase 客戶端
class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
  }

  async request(method, table, data = null) {
    const endpoint = `${this.url}/rest/v1/${table}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.anonKey}`,
      'apikey': this.anonKey,
    };

    const options = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        const error = await response.json();
        console.error('Supabase Error:', error);
        throw new Error(error.message || 'Database operation failed');
      }
      return method === 'DELETE' ? { success: true } : await response.json();
    } catch (error) {
      console.error('Supabase request failed:', error);
      throw error;
    }
  }

  insert(table, data) {
    return this.request('POST', table, data);
  }

  select(table, query = '') {
    return this.request('GET', `${table}${query}`);
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };
