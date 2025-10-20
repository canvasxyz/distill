# Twitter Archive Explorer

A browser-based application for analyzing tweets from your `.zip` export, which you can download from Twitter/X.

## Features

* Upload your archive .zip file for analysis; all archive contents
  remain in your browser.
* Create a filtered export of your archive, for uploading to public
  databases. Scan for NSFW tweets or offensive tweets using AI.
* Query your archive with arbitrary AI queries. (This will send your
  tweets to an LLM provider. We do not log or retain your tweets.)
* Data is stored in IndexedDB and can be wiped at any time by
  selecting **Close Archive** in the archive view.

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
