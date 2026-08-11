import Link from 'next/link';

export const metadata = { title: 'Over ons — Roulette Routes Roamers', description: 'Wie zijn de Roulette Routes Roamers en hoe werkt het?' };

export default function OverPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">

      {/* Intro */}
      <div className="mb-12">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C4622D' }}>Wie zijn wij</p>
        <h1 className="font-display text-5xl font-black leading-tight mb-5" style={{ color: '#2C1A0E' }}>
          Wij zijn de<br />
          <span style={{ color: '#C4622D' }}>Roamers</span>
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: '#5C3D1E' }}>
          Roulette Routes Roamers is een informele wandelgroep die op pad gaat zonder vooropgezet plan. De route staat pas vlak voor vertrek vast — soms bos, soms heide, soms polder. Wat altijd vaststaat is het gezelschap.
        </p>
      </div>

      {/* The name */}
      <div className="card p-7 mb-10">
        <h2 className="font-display font-bold text-xl mb-4" style={{ color: '#2C1A0E' }}>Wat betekent de naam?</h2>
        <dl className="space-y-4">
          {[
            { term: 'Roulette', def: 'De bestemming en route worden willekeurig bepaald. Niemand weet van tevoren precies waar we naartoe gaan — dat is de grap én de verrassing.' },
            { term: 'Routes', def: 'We lopen altijd een echte route: van A naar B naar A terug. Geen rondjes door de straat, maar buitenpaden, natuur en ruimte.' },
            { term: 'Roamers', def: 'Dat zijn wij. Roamers dwalen met bedoeling. Niet haastig, niet competitief — gewoon lopen, praten, genieten. Jij ook een Roamer? Dan ben je welkom.' },
          ].map(({ term, def }) => (
            <div key={term} className="flex gap-4">
              <dt className="font-display font-black text-base w-24 flex-shrink-0 pt-0.5" style={{ color: '#C4622D' }}>{term}</dt>
              <dd className="text-base leading-relaxed" style={{ color: '#5C3D1E' }}>{def}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* How it works */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-2xl mb-6" style={{ color: '#2C1A0E' }}>Hoe werkt het?</h2>
        <div className="space-y-5">
          {[
            { n: '1', title: 'We kiezen een datum', body: 'Zodra de volgende wandeldag gepland is, zetten we hem op de site. Je kunt je aanmelden zodat we weten wie er meekomt.' },
            { n: '2', title: 'De route wordt bekendgemaakt', body: 'Kort voor de wandeling ontvangen aangemelde Roamers de locatiedetails. Verrassing hoort erbij.' },
            { n: '3', title: 'We vertrekken samen', body: 'Op de afgesproken plek en tijd vertrekken we. Tempo is rustig: iedereen kan meepraten.' },
            { n: '4', title: 'Optioneel: lunch of borrel', body: 'Sommige wandelingen sluiten we af met een gezamenlijke lunch of borrel. Kosten worden eerlijk verdeeld via Tikkie.' },
          ].map(({ n, title, body }) => (
            <div key={n} className="flex gap-5 items-start">
              <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-base" style={{ background: '#C4622D', color: 'white' }}>{n}</span>
              <div>
                <p className="font-bold mb-1" style={{ color: '#2C1A0E' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#5C3D1E' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="mb-12" style={{ borderTop: '1px solid #EDD49A', paddingTop: '3rem' }}>
        <h2 className="font-display font-bold text-2xl mb-6" style={{ color: '#2C1A0E' }}>Wat we belangrijk vinden</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { icon: '🚶', title: 'Geen wedstrijd', body: 'We lopen op een tempo waarop iedereen kan meepraten. Je hoeft niet fit of ervaren te zijn.' },
            { icon: '🎲', title: 'Verrassing', body: 'De route is altijd een beetje onbekend. Dat houdt het fris voor iedereen, inclusief de organisatie.' },
            { icon: '💬', title: 'Verbinding', body: 'Wandelen en praten gaan hand in hand. Nieuwe gezichten zijn altijd welkom.' },
            { icon: '🌿', title: 'Buiten zijn', body: 'Bos, heide, polder of park: we zoeken altijd de natuur op. Schermen mogen thuis blijven.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="card p-5">
              <div className="text-3xl mb-3">{icon}</div>
              <p className="font-bold mb-1" style={{ color: '#2C1A0E' }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#5C3D1E' }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-10 rounded-2xl" style={{ background: '#2C1A0E' }}>
        <p className="font-display font-black text-2xl mb-2" style={{ color: '#F5E4C0' }}>Klaar om te roamen?</p>
        <p className="text-sm mb-6" style={{ color: '#8B5A2B' }}>Bekijk de aankomende wandelingen en meld je aan.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/wandelingen" className="btn-primary">Bekijk wandelingen</Link>
          <Link href="/aanmelden" className="btn-secondary" style={{ borderColor: '#5C3D1E', color: '#D5B08A' }}>Aanmelden</Link>
        </div>
      </div>

    </div>
  );
}
