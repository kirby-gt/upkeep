import { BOARD_GROUPS, PIPELINE_STATUS, PIPELINE_STATUS_ORDER } from '../constants.js';
import type { Owner, Property } from '../types.js';
import PropertyCard from './PropertyCard.js';

export default function PipelineBoard({
  properties,
  owners,
  onOpenProperty,
}: {
  properties: Property[];
  owners: Owner[];
  onOpenProperty: (id: string) => void;
}) {
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  if (properties.length === 0) {
    return (
      <div className="empty-note">
        No properties in the pipeline yet. Click <strong>+ Add Property</strong> to add the first one.
      </div>
    );
  }

  return (
    <div className="pipeline-board">
      {BOARD_GROUPS.map((group) => {
        const statusesInGroup = PIPELINE_STATUS_ORDER.filter((s) => PIPELINE_STATUS[s].group === group.key);
        const items = properties.filter((p) => statusesInGroup.includes(p.pipelineStatus));
        return (
          <div className="pipeline-col" key={group.key}>
            <div className="pipeline-col-head">
              <span className="status-pip" style={{ background: group.color }} />
              <h3>{group.label}</h3>
              <span className="group-count">{items.length}</span>
            </div>
            {items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                owner={property.ownerId ? ownerById.get(property.ownerId) : null}
                onClick={() => onOpenProperty(property.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
