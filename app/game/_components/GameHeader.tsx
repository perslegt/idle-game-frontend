type GameHeaderProps = {
    playerId?: string;
    cityId?: string;
    serverTime?: string;
    resources?: Record<string, number>;
};

function shortId(id?: string) {
    return id ? `${id.slice(0, 8)}…` : '';
}

function fmt(n?: number) {
    return typeof n === 'number' ? n.toLocaleString() : '-';
}

export default function GameHeader({ playerId, cityId, serverTime, resources }: GameHeaderProps) {
    return (
        <div style={{ padding: 12, border: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <div>Player: {shortId(playerId)} | City: {shortId(cityId)}</div>
                    <div>Server time: {serverTime ?? '-'}</div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>wood: <strong>{fmt(resources?.wood)}</strong></div>
                    <div>stone: <strong>{fmt(resources?.stone)}</strong></div>
                    <div>iron: <strong>{fmt(resources?.iron)}</strong></div>
                    <div>food: <strong>{fmt(resources?.food)}</strong></div>
                    <div>gold: <strong>{fmt(resources?.gold)}</strong></div>
                </div>
            </div>
        </div>
    );
}