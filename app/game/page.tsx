'use client';

import { useState } from "react";

export default function GamePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    
    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            if (!baseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
            const playerId = '98f8861c-1888-4ca8-aea2-6534be036743';

            const response = await fetch(`${baseUrl}/state?playerId=${encodeURIComponent(playerId)}`, { method: 'GET' });

            if (!response.ok) {
                const text = await response.text().catch(() => 'No response body');
                throw new Error(`API error: ${response.status} ${response.statusText} - ${text}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{ padding: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Game</h1>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={refresh} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh state'}
                </button>
            </div>

            {error && (
                <p style={{ marginTop: 12 }}>
                <strong>Error:</strong> {error}
                </p>
            )}

            <pre style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', overflow: 'auto' }}>
                {data ? JSON.stringify(data, null, 2) : 'Nog geen data. Klik op "Refresh state".'}
            </pre>
        </main>
    );
}