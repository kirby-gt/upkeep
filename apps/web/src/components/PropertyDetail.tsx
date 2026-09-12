import { useEffect, useState } from 'react';
import type { ActivityEntry, Owner, Photo, Property, Visit } from '../types.js';
import {
  createActivity,
  createVisit,
  deletePhoto,
  fetchActivity,
  fetchPhotos,
  fetchVisits,
  photoUrl,
  updatePropertyStatus,
  uploadPhotos,
} from '../api.js';
import { ACTIVITY_TYPES, PIPELINE_STATUS, PIPELINE_STATUS_ORDER, VISIT_STATUSES, VISIT_TYPES } from '../constants.js';
import { formatDate, formatDateTime, ownerDisplayName, statusColor } from '../lib/format.js';
import PhotoLightbox from './PhotoLightbox.js';

type Tab = 'overview' | 'activity' | 'visits';

export default function PropertyDetail({
  property,
  owner,
  onBack,
  backLabel = 'Back to pipeline',
  onStatusChanged,
}: {
  property: Property;
  owner: Owner | null | undefined;
  onBack: () => void;
  backLabel?: string;
  onStatusChanged: (updated: Property) => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDraft, setStatusDraft] = useState(property.pipelineStatus);

  useEffect(() => {
    setStatusDraft(property.pipelineStatus);
  }, [property.pipelineStatus]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchActivity(property.id), fetchVisits(property.id), fetchPhotos(property.id)])
      .then(([a, v, p]) => {
        if (cancelled) return;
        setActivity(a);
        setVisits(v);
        setPhotos(p);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [property.id]);

  async function handleStatusUpdate() {
    if (statusDraft === property.pipelineStatus) return;
    const updated = await updatePropertyStatus(property.id, statusDraft);
    onStatusChanged(updated);
    const refreshed = await fetchActivity(property.id);
    setActivity(refreshed);
  }

  async function handlePhotoUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const room = 5 - photos.length;
    if (room <= 0) return;
    const files = Array.from(fileList).slice(0, room);
    const inserted = await uploadPhotos(property.id, files);
    setPhotos((prev) => [...prev, ...inserted]);
  }

  async function handlePhotoDelete(photoId: string) {
    await deletePhoto(property.id, photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  const location = [property.line1, property.village, property.region].filter(Boolean).join(', ');

  return (
    <div>
      <button className="detail-back" onClick={onBack}>
        ← {backLabel}
      </button>
      <div className="topbar" style={{ padding: '10px 0', position: 'static', border: 'none' }}>
        <div>
          <h1>{property.name}</h1>
          <div className="sub">{location || '—'}</div>
        </div>
        <div className="topbar-actions">
          <select className="chip-select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
            {PIPELINE_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_STATUS[s].label}
              </option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={handleStatusUpdate} disabled={statusDraft === property.pipelineStatus}>
            Update Status
          </button>
        </div>
      </div>

      <div className="subnav" style={{ padding: 0, marginBottom: 18 }}>
        {(['overview', 'activity', 'visits'] as Tab[]).map((t) => (
          <button key={t} className={`subnav-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'activity' ? 'Activity' : 'Visits'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
      ) : tab === 'overview' ? (
        <OverviewTab property={property} owner={owner} photos={photos} onUpload={handlePhotoUpload} onDeletePhoto={handlePhotoDelete} />
      ) : tab === 'activity' ? (
        <ActivityTab propertyId={property.id} entries={activity} onAdded={(e) => setActivity((prev) => [e, ...prev])} />
      ) : (
        <VisitsTab propertyId={property.id} visits={visits} onAdded={(v) => setVisits((prev) => [v, ...prev])} />
      )}
    </div>
  );
}

function OverviewTab({
  property,
  owner,
  photos,
  onUpload,
  onDeletePhoto,
}: {
  property: Property;
  owner: Owner | null | undefined;
  photos: Photo[];
  onUpload: (files: FileList | null) => void;
  onDeletePhoto: (id: string) => void;
}) {
  const color = statusColor(property.pipelineStatus);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return (
    <div className="detail-grid">
      <div>
        <div className="panel" style={{ marginBottom: 16 }}>
          <h2>Property details</h2>
          <p className="panel-sub">Pipeline status and specs.</p>
          <div className="dl-row">
            <div className="dl-item">
              <span className="dl-label">Status</span>
              <span className="dl-value">
                <span className="pill" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
                  <span className="pip" />
                  {PIPELINE_STATUS[property.pipelineStatus]?.label ?? property.pipelineStatus}
                </span>
              </span>
            </div>
            <div className="dl-item">
              <span className="dl-label">Type</span>
              <span className="dl-value">
                {property.typeCategory}
                {property.typeSub ? ` · ${property.typeSub}` : ''}
              </span>
            </div>
            <div className="dl-item">
              <span className="dl-label">Added</span>
              <span className="dl-value">{formatDate(property.createdAt)}</span>
            </div>
          </div>
          <div className="dl-row">
            <div className="dl-item">
              <span className="dl-label">Building size</span>
              <span className="dl-value">{property.specs?.buildingSize || '—'}</span>
            </div>
            <div className="dl-item">
              <span className="dl-label">Land size</span>
              <span className="dl-value">{property.specs?.landSize || '—'}</span>
            </div>
            <div className="dl-item">
              <span className="dl-label">Bed / Bath</span>
              <span className="dl-value">
                {property.specs?.bedrooms || '—'} / {property.specs?.bathrooms || '—'}
              </span>
            </div>
            <div className="dl-item">
              <span className="dl-label">Parking</span>
              <span className="dl-value">{property.specs?.parking || '—'}</span>
            </div>
          </div>

          {property.features && property.features.length > 0 && (
            <>
              <div className="section-title">Features</div>
              <div className="tag-list">
                {property.features.map((f) => (
                  <span className="tag" key={f}>
                    {f}
                  </span>
                ))}
              </div>
            </>
          )}

          {property.targetClients && property.targetClients.length > 0 && (
            <>
              <div className="section-title">Target clients</div>
              <div className="tag-list">
                {property.targetClients.map((t) => (
                  <span className="tag tag-brand" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="section-title">Photos ({photos.length}/5)</div>
          <div className="photo-grid">
            {photos.map((p, i) => (
              <div
                className="photo-thumb-wrap"
                key={p.id}
                onClick={() => setLightboxIndex(i)}
                role="button"
                tabIndex={0}
              >
                <img src={photoUrl(property.id, p.storageKey)} alt="" />
                <button
                  type="button"
                  className="photo-thumb-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePhoto(p.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {lightboxIndex !== null && (
            <PhotoLightbox
              photos={photos}
              index={lightboxIndex}
              propertyId={property.id}
              onClose={() => setLightboxIndex(null)}
              onIndexChange={setLightboxIndex}
            />
          )}
          {photos.length < 5 && (
            <label className="file-btn" style={{ display: 'inline-block', marginTop: 6 }}>
              Add photos…
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  onUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <div className="panel" style={{ marginBottom: 16 }}>
          <h2>Owner</h2>
          <p className="panel-sub">{owner ? 'Contact on file' : 'No owner linked'}</p>
          {owner ? (
            <div className="dl-row" style={{ flexDirection: 'column', gap: 8 }}>
              <div className="dl-item">
                <span className="dl-label">Name</span>
                <span className="dl-value">{ownerDisplayName(owner)}</span>
              </div>
              <div className="dl-item">
                <span className="dl-label">Mobile</span>
                <span className="dl-value">{owner.mobile || '—'}</span>
              </div>
              <div className="dl-item">
                <span className="dl-label">Email</span>
                <span className="dl-value">{owner.email || '—'}</span>
              </div>
            </div>
          ) : (
            <p className="unassigned">Unassigned</p>
          )}
        </div>

        <div className="panel">
          <h2>Property contact</h2>
          <p className="panel-sub">{property.contactRole}</p>
          <div className="dl-row" style={{ flexDirection: 'column', gap: 8 }}>
            <div className="dl-item">
              <span className="dl-label">Name</span>
              <span className="dl-value">{property.contactName}</span>
            </div>
            <div className="dl-item">
              <span className="dl-label">Mobile</span>
              <span className="dl-value">{property.contactMobile}</span>
            </div>
            {property.contactEmail && (
              <div className="dl-item">
                <span className="dl-label">Email</span>
                <span className="dl-value">{property.contactEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({
  propertyId,
  entries,
  onAdded,
}: {
  propertyId: string;
  entries: ActivityEntry[];
  onAdded: (entry: ActivityEntry) => void;
}) {
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [text, setText] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return setError('Entry text is required.');
    setError(null);
    setSubmitting(true);
    try {
      const entry = await createActivity(propertyId, {
        type,
        text: text.trim(),
        nextAction: nextAction.trim(),
        followUpDate: followUpDate || null,
      });
      onAdded(entry);
      setText('');
      setNextAction('');
      setFollowUpDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="detail-grid">
      <div className="panel">
        <h2>Activity log</h2>
        <p className="panel-sub">Every call, visit, and note for this property.</p>
        {entries.length === 0 ? (
          <div className="empty-note">No activity yet.</div>
        ) : (
          <div className="timeline">
            {entries.map((entry) => (
              <div className="tl-item" key={entry.id}>
                <span className="tl-dot" />
                <div className="tl-content">
                  <div className="tl-status">{entry.type}</div>
                  <div className="tl-note">{entry.text}</div>
                  {entry.nextAction && <div className="tl-note">Next: {entry.nextAction}</div>}
                  <div className="tl-meta">
                    {entry.by} · {formatDateTime(entry.at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Add entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required />
          </div>
          <div className="field">
            <label>Next action</label>
            <input type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
          </div>
          <div className="field">
            <label>Follow-up date</label>
            <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VisitsTab({
  propertyId,
  visits,
  onAdded,
}: {
  propertyId: string;
  visits: Visit[];
  onAdded: (visit: Visit) => void;
}) {
  const [date, setDate] = useState('');
  const [type, setType] = useState(VISIT_TYPES[0]);
  const [status, setStatus] = useState(VISIT_STATUSES[1]);
  const [attendees, setAttendees] = useState('1');
  const [client, setClient] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError('Visit date is required.');
    setError(null);
    setSubmitting(true);
    try {
      const visit = await createVisit(propertyId, {
        date,
        type,
        status,
        attendees: Number(attendees) || 1,
        client: client.trim() || 'Internal',
      });
      onAdded(visit);
      setDate('');
      setClient('');
      setAttendees('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="detail-grid">
      <div className="panel">
        <h2>Visits</h2>
        <p className="panel-sub">Site visits and showings for this property.</p>
        {visits.length === 0 ? (
          <div className="empty-note">No visits scheduled yet.</div>
        ) : (
          <div className="visit-list">
            {visits.map((v) => (
              <div className="visit-item" key={v.id}>
                <div>
                  <div className="vi-type">{v.type}</div>
                  <div className="vi-meta">
                    {formatDate(v.date)} · {v.client} · {v.attendees} attendee{v.attendees === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="tag">{v.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Add visit</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {VISIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {VISIT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-cols">
            <div className="field">
              <label>Attendees</label>
              <input type="number" min="1" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
            </div>
            <div className="field">
              <label>Client</label>
              <input type="text" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Internal" />
            </div>
          </div>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
