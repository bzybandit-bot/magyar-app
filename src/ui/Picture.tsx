import { useEffect, useState } from "react";
import { getMedia } from "../lib/db";
import { hueOf } from "../lib/language";

function TableGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 80 80" aria-hidden="true">
      <rect x="10" y="28" width="60" height="8" rx="2" fill="#c9854a" />
      <rect x="16" y="36" width="6" height="24" rx="1.5" fill="#8a5a32" />
      <rect x="58" y="36" width="6" height="24" rx="1.5" fill="#8a5a32" />
    </svg>
  );
}

export function Picture({
  id,
  emoji,
  imageId,
  label,
}: {
  id: string;
  emoji: string;
  imageId?: string;
  label: string;
}) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!imageId) {
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    let current = "";
    void getMedia(imageId).then((blob) => {
      if (cancelled || !blob) return;
      current = URL.createObjectURL(blob);
      setUrl(current);
    });
    return () => {
      cancelled = true;
      if (current) URL.revokeObjectURL(current);
    };
  }, [imageId]);

  const hue = hueOf(id);
  return (
    <div className={url ? "picture photo" : "picture"} role="img" aria-label={label} style={url ? undefined : { background: `hsl(${hue} 42% 88%)` }}>
      {url ? (
        <img src={url} alt="" />
      ) : (
        <>
          <span className="blob" style={{ background: `hsl(${hue} 48% 74%)` }} />
          {id === "asztal" ? <TableGlyph /> : <span className="emoji">{emoji}</span>}
        </>
      )}
    </div>
  );
}
