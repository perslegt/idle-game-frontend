'use client';

import { useEffect, useMemo, useState } from "react";
import GameHeader from "./_components/GameHeader";

const TRAIN_MAX_PER_LEVEL = 100;
const MAX_LEVELS_SHOWN = 3;

export default function GamePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    const [displayResources, setDisplayResources] = useState<Record<string, number> | null>(null);
    const [snapshotResources, setSnapshotResources] = useState<Record<string, number> | null>(null);
    const [snapshotRates, setSnapshotRates] = useState<Record<string, number> | null>(null);
    const [snapshotReceivedAtMs, setSnapshotReceivedAtMs] = useState<number | null>(null);
    
    const [trainQtyByKey, setTrainQtyByKey] = useState<Record<string, number>>({});

    const buildings = data?.state?.buildings ?? [];
    const troops = data?.state?.troops ?? [];

    const cityId = data?.cityId; // uit state response
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    const sliderKey = (troopType: string, level: number) => `${troopType}:${level}`;

    const troopsByCategory = useMemo(() => {
        const grouped: Record<string, any[]> = { infantry: [], archers: [], cavalry: [] };
        for (const t of troops) {
            const cat = t?.troopType?.category?.code;
            if (cat && grouped[cat]) grouped[cat].push(t);
        }
        return grouped;
    }, [troops]);
    
    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            // TODO: cityId niet hardcoden maar uit response halen (of uit context/global state als we die hebben)
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

    async function trainTroops(troopType: string, level: number) {
        setLoading(true);
        setError(null);

        try {
            if (!cityId) throw new Error('City ID is not available in the current state');
            if (!Number.isInteger(level) || level < 1) throw new Error('Level moet een integer >= 1 zijn.');

            const k = sliderKey(troopType, level);
            const quantity = Math.floor(trainQtyByKey[k] ?? 0);

            if (!Number.isFinite(quantity) || quantity < 1) {
                throw new Error('Quantity moet een integer >= 1 zijn.');
            }

            const response = await fetch(`${baseUrl}/cities/${cityId}/troops/${troopType}/train`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity, level }),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => 'No response body');
                throw new Error(`Train failed: HTTP ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`);
            }

            const json = await response.json();
            setData(json);

            setTrainQtyByKey((prev) => ({ ...prev, [k]: 0 }));
        } catch (e: any) {
            setError(e?.message ?? 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    }

    // Auto-refresh every minute when we have a city loaded
    useEffect(() => {
        if (!data?.cityId) return;
        const interval = setInterval(() => {
            refresh();
        }, 60000);
        return () => clearInterval(interval);
    }, [data?.cityId]);

    // Snapshot reset with every new data fetch
    useEffect(() => {
        const r = data?.state?.resources;
        const rates = data?.ratesPerSecond;
        if (!r || !rates) return;

        setSnapshotResources(r);
        setSnapshotRates(rates);
        setSnapshotReceivedAtMs(Date.now());
        setDisplayResources(r);
    }, [data]);

    // Update displayed resources every second based on snapshot + rates
    useEffect(() => {
        if (!snapshotResources || !snapshotRates || !snapshotReceivedAtMs) return;

        const interval = setInterval(() => {
            const elapsedSeconds = (Date.now() - snapshotReceivedAtMs) / 1000;
            const next: Record<string, number> = { ...snapshotResources };

            for (const key of Object.keys(next)) {
                const base = snapshotResources[key] ?? 0;
                const rate = snapshotRates[key] ?? 0;
                next[key] = Math.floor(base + rate * elapsedSeconds);
            }
            setDisplayResources(next);
        }, 1000);

        return () => clearInterval(interval);
    }), [snapshotResources, snapshotRates, snapshotReceivedAtMs];

    

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
                resources={displayResources ?? data?.state?.resources}
            />

            {/* Buildings */}
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

            {/* Training */}
            <div style={{ marginTop: 12, padding: 12, border: '1px solid #222' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Training</h2>

                {[
                { title: 'Barracks', category: 'infantry' },
                { title: 'Range', category: 'archers' },
                { title: 'Stables', category: 'cavalry' },
                ].map((section) => {
                const list = troopsByCategory[section.category] ?? [];

                return (
                    <div
                    key={section.category}
                    style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #333' }}
                    >
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>{section.title}</h3>

                    {list.length ? (
                        <ul style={{ marginTop: 8 }}>
                        {list.map((t: any, idx: number) => {
                            const troopType = t?.troopType?.code;

                            return (
                            <li key={`${troopType ?? 'troop'}-${idx}`} style={{ marginTop: 10 }}>
                                <div style={{ fontWeight: 600 }}>
                                {t?.troopType?.category?.code}/{troopType} — owned qty {t?.quantity}
                                </div>

                                {/* Levels */}
                                <div style={{ marginTop: 8 }}>
                                {Array.from({ length: MAX_LEVELS_SHOWN }, (_, i) => i + 1).map((lvl) => {
                                    const k = troopType ? sliderKey(troopType, lvl) : '';
                                    const value = troopType ? (trainQtyByKey[k] ?? 0) : 0;

                                    return (
                                    <div
                                        key={lvl}
                                        style={{
                                        marginTop: 8,
                                        padding: 8,
                                        border: '1px solid #333',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ minWidth: 110 }}>Lvl {lvl} trainen</div>

                                        <input
                                            type="range"
                                            min={0}
                                            max={TRAIN_MAX_PER_LEVEL}
                                            value={value}
                                            onChange={(e) => {
                                            const nextVal = Math.max(
                                                0,
                                                Math.min(TRAIN_MAX_PER_LEVEL, Number(e.target.value) || 0),
                                            );
                                            if (!troopType) return;
                                            setTrainQtyByKey((prev) => ({ ...prev, [k]: nextVal }));
                                            }}
                                            disabled={!troopType || loading}
                                            style={{ flex: 1 }}
                                        />

                                        <div style={{ width: 50, textAlign: 'right' }}>{value}</div>

                                        <button
                                            onClick={() => troopType && trainTroops(troopType, lvl)}
                                            disabled={loading || !troopType || value < 1}
                                        >
                                            Train
                                        </button>
                                        </div>
                                    </div>
                                    );
                                })}
                                </div>
                            </li>
                            );
                        })}
                        </ul>
                    ) : (
                        <p style={{ marginTop: 8 }}>Geen troop types in deze categorie.</p>
                    )}
                    </div>
                );
                })}
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