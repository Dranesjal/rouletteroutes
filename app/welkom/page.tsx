import Link from 'next/link';

export const metadata = { title: 'Welkom | Roulette Routes Roamers' };

export default function WelkomPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="font-display text-4xl font-black mb-4" style={{ color: '#2C1A0E' }}>
        Account bevestigd!
      </h1>
      <p className="text-lg leading-relaxed mb-8" style={{ color: '#5C3D1E' }}>
        Welkom bij de Roulette Routes Roamers. Je account is actief. Bekijk de aankomende wandelingen en meld je aan.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/wandelingen" className="btn-primary">Bekijk wandelingen</Link>
        <Link href="/" className="btn-secondary">Naar homepage</Link>
      </div>
    </div>
  );
}
