/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        '/',
        '/wandelingen',
        '/wandelingen/hoge-veluwe-okt-2026',
        '/over',
        '/aanmelden',
      ],
      numberOfRuns: 1,
      settings: {
        // Skip audits that require a real network/login
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'color-contrast': ['warn', {}],
        'meta-description': ['warn', {}],
        'document-title': ['error', {}],
        'html-has-lang': ['error', {}],
        'image-alt': ['warn', {}],
        // SSR/serverless verwachte beperkingen — geen errors
        'bf-cache': ['warn', {}],
        'document-latency-insight': ['warn', {}],
        'image-delivery-insight': ['warn', {}],
        'legacy-javascript-insight': ['warn', {}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
