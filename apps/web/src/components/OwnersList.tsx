import type { Owner, Property } from '../types.js';
import { ownerDisplayName } from '../lib/format.js';

export default function OwnersList({
  owners,
  properties,
  onOpenOwner,
}: {
  owners: Owner[];
  properties: Property[];
  onOpenOwner: (id: string) => void;
}) {
  if (owners.length === 0) {
    return (
      <div className="empty-note">
        No owners on file yet. Click <strong>+ Add Owner</strong>, or add one while adding a property.
      </div>
    );
  }

  return (
    <div className="queue-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
      {owners.map((owner) => {
        const count = properties.filter((p) => p.ownerId === owner.id).length;
        return (
          <div className="owner-card" key={owner.id} onClick={() => onOpenOwner(owner.id)} role="button" tabIndex={0}>
            <div>
              <div className="oc-name">{ownerDisplayName(owner)}</div>
              <div className="oc-meta">
                {owner.mobile}
                {owner.email ? ` · ${owner.email}` : ''}
              </div>
            </div>
            <div className="oc-count">
              {count} {count === 1 ? 'property' : 'properties'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
