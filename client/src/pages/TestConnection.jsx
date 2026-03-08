import { useState, useEffect } from 'react';
import api from '../api/client';

export default function TestConnection() {
  const [status, setStatus] = useState('testing...');
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test health endpoint
      const healthRes = await fetch('http://localhost:5000/api/health');
      const healthData = await healthRes.json();
      
      if (healthData.status === 'ok') {
        setStatus('✅ Backend Connected!');
      }

      // Try to fetch clients (will fail if not authenticated, but that's ok for now)
      try {
        const clientsRes = await api.get('/clients');
        setClients(clientsRes.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Need to login first');
      }
    } catch (err) {
      setStatus('❌ Backend NOT Connected');
      setError(err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">Connection Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-2">Backend Status</h2>
        <p className="text-2xl">{status}</p>
        {error && (
          <p className="text-red-600 mt-2">Error: {error}</p>
        )}
      </div>

      {clients.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Clients Found</h2>
          {clients.map(client => (
            <div key={client.id} className="border-b py-2">
              {client.full_name} - {client.email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}