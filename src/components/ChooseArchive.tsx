import { useSelectedAccount } from "../hooks/useSelectedAccount";
import { ArchiveDropZone } from "./ArchiveDropZone";

export function ChooseArchive() {
  const { openPeople } = useSelectedAccount();
  return (
    <section className="getting-started" aria-label="Get started">
      <div className="start-options">
        <div>
          <h2>Someone you’re curious about</h2>
          <p>
            Choose from Twitter archives people have shared with Community
            Archive.
          </p>
          <button className="choose-person-button" onClick={openPeople}>
            Choose someone ↗
          </button>
        </div>
        <div>
          <h2>A little self-reflection</h2>
          <p>
            Bring your own Twitter/X archive. Keep it as the original .zip file.
          </p>
          <ArchiveDropZone />
        </div>
      </div>
      <p className="quiet-note">
        Archives stay in this browser. When you ask a question, the selected
        posts are sent to the AI provider. Importing here doesn’t publish your
        archive.
      </p>
    </section>
  );
}
