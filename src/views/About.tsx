import { PageContent } from "../components/PageContent";

export function About() {
  return (
    <PageContent>
      <div className="page-intro">
        <p className="eyebrow">People are interesting.</p>
        <h1>What is this?</h1>
      </div>
      <AboutContent />
    </PageContent>
  );
}

export function AboutContent() {
  return (
    <div className="about-copy">
      <p>
        Distill takes someone’s tweets and tries to get a sense of them.
        Yourself, a friend, someone you’re curious about.
      </p>
      <p>
        Ask about their strengths, what they enjoy, or their personality type.
        It might ring true. It might miss completely. Either can be interesting.
      </p>
      <p>
        <a
          href="https://www.community-archive.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Community Archive
        </a>{" "}
        preserves Twitter archives that people have contributed for others to
        explore. Distill puts those archives and AI together. You can also
        import your own Twitter/X archive.
      </p>
      <p>
        It starts with their tweets. Knowing the person is still a separate
        activity.
      </p>
      <div className="info-panel">
        <h2>What gets sent where?</h2>
        <p>
          Archives and past answers are kept in this browser. Asking a question
          sends the selected posts to the AI provider. Making an avatar also
          uses profile information and, if you choose, the current avatar as a
          reference.
        </p>
        <p>
          Importing your own archive here does not contribute it to Community
          Archive.
        </p>
      </div>
      <p className="quiet-note">
        Built by{" "}
        <a
          href="https://github.com/raykyri"
          target="_blank"
          rel="noopener noreferrer"
        >
          raykyri
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/rjwebb"
          target="_blank"
          rel="noopener noreferrer"
        >
          rjwebb
        </a>{" "}
        ·{" "}
        <a href="http://canvas.xyz" target="_blank" rel="noopener noreferrer">
          Canvas Technologies Inc
        </a>
      </p>
    </div>
  );
}
