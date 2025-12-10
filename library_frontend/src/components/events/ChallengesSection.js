import React, { useEffect, useState } from 'react';
import { getChallenges, joinChallenge, leaveChallenge, recordChallengeProgress } from '../../services/events';
import './challenges.css';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function ChallengesSection() {
  /** Show active reading challenges, join/leave, and record progress. */
  const { t } = useTranslation();
  const [data, setData] = useState({ list: [], memberships: {} });
  const [loading, setLoading] = useState(true);
  const [inp, setInp] = useState({});

  async function refresh() {
    setLoading(true);
    const res = await getChallenges();
    setData(res);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <div className="ch-wrap">{t('Loading')}...</div>;

  return (
    <div className="ch-wrap">
      <div className="ch-head">
        <h3>{t('Challenges')}</h3>
      </div>
      <div className="ch-grid">
        {data.list.map((ch) => {
          const mem = data.memberships[ch.id];
          return (
            <div key={ch.id} className="ch-card">
              <div className="ch-title">{ch.title}</div>
              <div className="ch-desc">{ch.description}</div>
              <div className="ch-meta">
                <span>{t('Progress')}: {mem?.progress || 0} / {ch.target} {t(ch.unit)}</span>
              </div>
              <div className="ch-actions">
                {!mem ? (
                  <button className="ch-btn join" onClick={async () => { await joinChallenge(ch.id); refresh(); }}>
                    {t('Join')}
                  </button>
                ) : (
                  <button className="ch-btn leave" onClick={async () => { await leaveChallenge(ch.id); refresh(); }}>
                    {t('Leave')}
                  </button>
                )}
              </div>
              {mem && (
                <div className="ch-progress">
                  <input
                    type="number"
                    min="0"
                    placeholder={t('Add progress')}
                    value={inp[ch.id] || ''}
                    onChange={(e) => setInp({ ...inp, [ch.id]: e.target.value })}
                  />
                  <button
                    className="ch-btn add"
                    onClick={async () => {
                      const amount = Number(inp[ch.id] || 0);
                      if (amount > 0) {
                        await recordChallengeProgress(ch.id, { amount });
                        setInp({ ...inp, [ch.id]: '' });
                        refresh();
                      }
                    }}
                  >
                    + {t('Progress')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
