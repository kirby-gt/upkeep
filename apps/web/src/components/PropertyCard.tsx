import type { Owner, Property } from '../types.js';
import { statusColor, statusLabel, ownerDisplayName } from '../lib/format.js';

export default function PropertyCard({
  property,
  owner,
  onClick,
}: {
  property: Property;
  owner: Owner | null | undefined;
  onClick: () => void;
}) {
  const color = statusColor(property.pipelineStatus);
  const location = [property.village, property.region].filter(Boolean).join(', ') || property.city || '—';

  return (
    <div className="property-card" onClick={onClick} role="button" tabIndex={0}>
      <h4>{property.name}</h4>
      <div className="pc-loc">{location}</div>
      <div className="pc-sub-status" style={{ color }}>
        {statusLabel(property.pipelineStatus)}
      </div>
      <div className="pc-foot">
        <span className="pc-owner">
          {owner ? (
            ownerDisplayName(owner)
          ) : (
            <span className="unassigned">Unassigned</span>
          )}
        </span>
        <span className="pill" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
          <span className="pip" />
          {property.typeSub || property.typeCategory}
        </span>
      </div>
    </div>
  );
}
