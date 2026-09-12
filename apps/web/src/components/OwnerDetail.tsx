import type { Owner, Property } from '../types.js';
import { ownerDisplayName } from '../lib/format.js';
import PropertyCard from './PropertyCard.js';

export default function OwnerDetail({
  owner,
  properties,
  onBack,
  onOpenProperty,
}: {
  owner: Owner;
  properties: Property[];
  onBack: () => void;
  onOpenProperty: (id: string) => void;
}) {
  return (
    <div>
      <button className="detail-back" onClick={onBack}>
        ← Back to owners
      </button>
      <div className="topbar" style={{ padding: '10px 0', position: 'static', border: 'none' }}>
        <div>
          <h1>{ownerDisplayName(owner)}</h1>
          <div className="sub">
            {owner.mobile}
            {owner.email ? ` · ${owner.email}` : ''}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h2>Contact</h2>
        <div className="dl-row" style={{ flexDirection: 'column', gap: 8 }}>
          <div className="dl-item">
            <span className="dl-label">Mobile</span>
            <span className="dl-value">{owner.mobile || '—'}</span>
          </div>
          <div className="dl-item">
            <span className="dl-label">Email</span>
            <span className="dl-value">{owner.email || '—'}</span>
          </div>
          <div className="dl-item">
            <span className="dl-label">Address</span>
            <span className="dl-value">{owner.address || '—'}</span>
          </div>
        </div>
        {owner.notes && (
          <>
            <div className="section-title">Notes</div>
            <p>{owner.notes}</p>
          </>
        )}
      </div>

      <div className="panel">
        <h2>Properties ({properties.length})</h2>
        <p className="panel-sub">Everything on file for this owner.</p>
        {properties.length === 0 ? (
          <div className="empty-note">No properties linked to this owner yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} owner={owner} onClick={() => onOpenProperty(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
