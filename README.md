# Twitter Archive Explorer

A browser-based application for analyzing tweets from your `.zip` export, which you can download from Twitter/X.

## Features

* Upload your archive .zip file for analysis; all archive contents
  remain in your browser.
* Create a filtered export of your archive, for uploading to public
  databases. Scan for NSFW tweets or offensive tweets using AI.
* Query your archive with arbitrary AI queries. (This uses OpenRouter
  and will send your tweets to an LLM provider; we do not log or
  retain your tweets.)
* Data is stored in IndexedDB and can be wiped at any time by
  selecting **Clear My Data** in the archive view, which deletes the
  database and reloads the page.

## Usage

Node.js 18+ and [pnpm](https://pnpm.io/) are required.

```
pnpm install
pnpm dev
```

To build for production:

```
pnpm build
```
