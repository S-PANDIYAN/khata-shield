# Khata Shield

**Privacy-first digital financial records and GST awareness for small vendors.**

Khata Shield is a complete offline-first progressive web app (PWA) prototype built for Bengaluru's street vendors, tea stalls, food sellers, small traders, and other informal businesses. It separates genuine business sales from personal and pass-through receipts so total money received is not confused with business turnover.

## What is included

- Manual transaction entry with Business / Personal / Other classification
- Lightweight rule-based classification suggestions that learn from confirmed entries
- Optional browser voice entry (for example: “Received 250 rupees from Ravi for tea”)
- Dashboard with monthly sales, inflow, non-business receipts, record health, and six-month trend
- Search and filters, edit/delete, and payment method tracking
- Monthly proof-ready report, print/PDF, and CSV export
- Last-12-month activity awareness gauge with a configurable reference amount
- Local JSON backup and restore
- Installable PWA with offline caching
- Responsive mobile/desktop UI and demo data
- No backend, login, analytics, advertising SDK, or cloud database

## Quick start

### Easiest (Python)

```bash
cd khata-shield
python -m http.server 8080
```

Open <http://localhost:8080>. Using a local server enables installation and offline caching. Double-clicking `index.html` also works for most features, but browsers disable service workers on `file://` URLs.

### Node alternative

```bash
npx --yes serve@14.2.4 .
```

No build or dependency installation is required.

## Demo flow

1. Open **Settings** → **Load demo data**.
2. Review business versus total inflow on **Dashboard**.
3. Add a family transfer and classify it as **Personal**.
4. Add a sale and classify it as **Business**.
5. Open **Reports**, select the month, and use **Print / PDF** or **Export CSV**.
6. Open **Awareness** to explain that the indicator uses only Business entries and is not tax advice.
7. Export a JSON backup from **Settings**.

## Privacy and security model

- Transaction data is stored in the current browser profile via `localStorage`.
- Computation and classification run locally in JavaScript.
- No network API receives financial records.
- Exported JSON/CSV files are unencrypted; the user controls where they are stored or shared.
- Browser storage can be erased by clearing site data. Regular backups are recommended.
- Voice recognition is optional. Browser implementations may use the browser vendor's speech service; the UI discloses this limitation.
- This hackathon MVP is single-device and does not provide authentication or encrypted-at-rest browser storage.

## GST-awareness boundary

Khata Shield is a record-keeping and general-awareness tool. It does **not** determine GST registration, tax liability, legal status, exemptions, or filing requirements. The configurable threshold is deliberately called an **awareness reference amount**. Users are directed to a qualified chartered accountant or tax professional for advice.

## Architecture

```text
Browser / installed PWA
├── index.html             Semantic UI and screens
├── styles.css             Responsive presentation and print report
├── app.js                 UI state, persistence, exports, speech and PWA install
├── core.js                Pure validation, classifier, parser, summaries and CSV
├── sw.js                  Offline cache service worker
├── manifest.webmanifest   PWA metadata
└── localStorage           Transactions, learned rules and user settings
```

The pure domain functions in `core.js` are shared between the browser and Node tests.

## Automated tests

```bash
node --test tests/core.test.js
```

## Android enhancement roadmap

The PWA covers the web deliverable. A production Android companion can add capabilities browsers cannot reliably provide:

1. Kotlin + Jetpack Compose UI and Room/SQLCipher local database.
2. Explicit opt-in `NotificationListenerService` limited to a user-approved allow-list of known UPI apps.
3. Parse only amount, sender/reference, and timestamp; show every captured receipt for confirmation.
4. Never read OTPs, messages, contacts, bank credentials, or notification content unrelated to payment receipts.
5. On-device rules/TFLite classifier with correction feedback; no silent automatic accounting decision.
6. Android SpeechRecognizer with an offline language pack where available.
7. Encrypted export/import and optional user-controlled sync using end-to-end encryption.
8. Kannada, Hindi, Tamil, Telugu, and additional regional-language UX.

Notification access is highly sensitive and must be transparent, revocable, purpose-limited, tested across supported UPI apps, and reviewed against Google Play policy before release.

## Production next steps

- Replace `localStorage` with encrypted IndexedDB or a native encrypted database.
- Add accessibility and regional-language user testing with real vendors.
- Add explicit data retention controls and threat-model review.
- Have GST wording reviewed by qualified Indian tax counsel/accountants.
- Add signed releases, CSP headers, dependency scanning, and end-to-end tests.

## License

MIT — see `LICENSE`.
