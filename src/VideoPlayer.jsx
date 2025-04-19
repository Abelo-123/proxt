import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [subtitleTracks, setSubtitleTracks] = useState([]);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true, // Optimize bandwidth usage
      });

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setSubtitleTracks(hls.subtitleTracks || []);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
        setSubtitleTracks(data.subtitleTracks || []);
      });

      // Let HLS handle auto-quality without manually modifying levels
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        controls
        autoPlay
        style={{ width: "100%", height: "auto", background: "#000" }}
        crossOrigin="anonymous"
      >
        {subtitleTracks.map((track, idx) => (
          <track
            key={idx}
            kind="subtitles"
            label={track.name || `Subtitle ${idx + 1}`}
            srcLang={track.lang || "en"}
            src={track.url}
            default={idx === 0}
          />
        ))}
      </video>
    </div>
  );
};

export default VideoPlayer;
