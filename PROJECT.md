# Hackathon submission summary

## Problem

Digital receipts in a vendor's bank account can combine genuine sales, family transfers, reimbursements, loans, and pass-through money. Total receipts therefore need not equal business turnover. Vendors without bookkeeping support can struggle to reconstruct the distinction and may become afraid of accepting UPI.

## Solution

Khata Shield gives each receipt an explicit Business, Personal, or Other classification. It reports recorded business sales independently from total inflow, creates simple monthly statements, and shows non-advisory financial-awareness indicators. Its offline-first PWA minimizes data collection and cloud dependence.

## Innovation

- Privacy and financial inclusion are treated as primary design constraints.
- A transparent classifier gives suggestions rather than making hidden financial decisions.
- Confirmed user categories become local learned rules.
- A proof-ready summary makes records usable while retaining a clear non-audited disclaimer.
- The same experience runs as a web app or installed PWA without an account.

## AI/ML component

The MVP uses lightweight explainable rules and correction learning. This is appropriate for a small, privacy-sensitive dataset and remains understandable to users. A production enhancement can train a compact on-device classifier from merchant-specific corrections after collecting consented, representative data. Voice entry transforms natural speech into amount, sender, note, date, and suggested category.

## Impact metrics

A pilot should measure classification completion rate, reduction in unclassified receipts, monthly active vendors, report exports, time required to reconstruct a month, continued digital-payment acceptance, and user understanding that total inflow differs from business turnover.

## Recommended department and category

- Department: Artificial Intelligence & Machine Learning
- Category: FinTech / Financial Inclusion

## Scope statement

This submission is a functional web/PWA MVP. Android notification capture is documented as an optional, consent-based next phase because NotificationListenerService is native Android functionality and cannot be implemented safely by an ordinary website.
