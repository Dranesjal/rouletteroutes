'use client';
import { useRef, useState } from 'react';

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}

export default function PhotoUpload({ label, hint, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload-photo', { method: 'POST', body: form });
    const data = await res.json();
    setUploading(false);
    if (data.error) { setError(data.error); return; }
    onChange(data.url);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="label-sm block mb-1">
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: '#8B5A2B' }}>{hint}</span>}
      </label>
      {value && (
        <div className="mb-2 relative rounded-xl overflow-hidden border" style={{ borderColor: '#EDD49A' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full object-cover max-h-48" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 text-xs px-2 py-1 rounded font-semibold"
            style={{ background: '#FEE2E2', color: '#991B1B' }}>
            Verwijderen
          </button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-semibold px-3 py-2 rounded-lg"
          style={{ background: '#F5E4C0', color: '#5C3D1E', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? 'Uploaden...' : value ? 'Vervangen' : '+ Foto uploaden'}
        </button>
        {value && (
          <span className="text-xs truncate max-w-xs" style={{ color: '#8B5A2B' }}>{value}</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs mt-1" style={{ color: '#991B1B' }}>{error}</p>}
    </div>
  );
}
