const API_URL = '/api';

export const api = {
  get: async (table: string) => {
    const res = await fetch(`${API_URL}/${table}`);
    return res.json();
  },
  post: async (table: string, data: any) => {
    const res = await fetch(`${API_URL}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  delete: async (table: string, id: string) => {
    const res = await fetch(`${API_URL}/${table}/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  getConfig: async () => {
    const res = await fetch(`${API_URL}/config`);
    return res.json();
  },
  postConfig: async (config: any) => {
    const res = await fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },
  backup: async () => {
    const res = await fetch(`${API_URL}/backup`);
    return res.json();
  },
  restore: async (data: any) => {
    const res = await fetch(`${API_URL}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getActivation: async () => {
    const res = await fetch(`${API_URL}/activation`);
    return res.json();
  },
  postActivation: async (status: any) => {
    const res = await fetch(`${API_URL}/activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
    return res.json();
  }
};
