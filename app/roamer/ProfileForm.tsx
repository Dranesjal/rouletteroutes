'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userId: string;
  initialName: string;
  initialDietary: string;
}

export default function ProfileForm({ userId, initialName, initialDietary }: Props) {
  const [name, setName] = useState(initialName);
  const [dietary, setDietary] = useState(initialDietary);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .update({ name: name.trim(), dietary: dietary.trim() })
      .eq('id', userId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-sm block mb-1">Naam</label>
        <input
          className="field"
          type="text"
          placeholder="Je volledige naam"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label-sm block mb-1">Dieetwensen / allergieën</label>
        <input
          className="field"
          type="text"
          placeholder="Bijv. vegetarisch, glutenvrij, notenallergie..."
          value={dietary}
          onChange={e => setDietary(e.target.value)}
        />
        <p className="text-xs mt-1" style={{ color: '#8B5A2B' }}>
          Wordt automatisch ingevuld bij je volgende aanmelding.
        </p>
      </div>
      {error && (
        <p className="text-sm p-3 rounded-lg" style={{ background: '#FEE2E2', color: '#991B1B' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="btn-primary"
        style={{ opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Opslaan...' : saved ? '✓ Opgeslagen' : 'Profiel opslaan'}
      </button>
    </form>
  );
}
