'use client';

import { useState } from "react";
import GameHeader from "./_components/GameHeader";

export default function GamePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    const state = data?.state;
    const resources = state?.resources;
    const tick = data?.tick;

    function shortId(id?: string) {
        return id ? `${id.slice(0, 8)}…` : '';
    }
    
    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            if (!baseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
            const cityId = '5ad357d7-1f9f-49f9-8e42-1f9b4834dcaa';

            const response = await fetch(`${baseUrl}/state?cityId=${encodeURIComponent(cityId)}`, { method: 'GET' });

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

    async function upgradeBuilding(buildingCode: string) {
        setLoading(true);
        setError(null);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            if (!baseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
            const cityId = data?.cityId;
            if (!cityId) throw new Error('City ID is not available in the current state');

            const response = await fetch(`${baseUrl}/cities/${cityId}/buildings/${buildingCode}/upgrade`, { method: 'POST' });

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

    const buildings = data?.state?.buildings ?? [];

    return (
        <main style={{ padding: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Game</h1>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={refresh} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh state'}
                </button>
            </div>

            <GameHeader
                playerId={data?.playerId}
                cityId={data?.cityId}
                serverTime={data?.serverTime}
                resources={data?.state?.resources}
            />

            <div style={{ marginTop: 12, padding: 12, border: '1px solid #222' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Buildings</h2>

            {buildings.length ? (
                <ul style={{ marginTop: 8 }}>
                {buildings.map((b: any, idx: number) => {
                    const code = b?.buildingType?.code;
                    return (
                    <li key={`${code ?? 'building'}-${idx}`} style={{ marginTop: 6 }}>
                        {code} — lvl {b?.level} — produces {b?.buildingType?.productionResource ?? '-'}
                        <button
                        onClick={() => upgradeBuilding(code)}
                        disabled={loading || !code}
                        style={{ marginLeft: 8 }}
                        >
                        Upgrade
                        </button>
                    </li>
                    );
                })}
                </ul>
            ) : (
                <p style={{ marginTop: 8 }}>Geen buildings geladen. Klik eerst op Refresh state.</p>
            )}
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