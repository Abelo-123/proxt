import { useEffect, useState, useRef } from "react";
import VideoPlayer from "./VideoPlayer";
import axios from "axios";

// M3U Parser
const parseM3U = (text) => {
  const lines = text.split("\n");
  const channels = [];
  let current = {};
  for (let line of lines) {
    if (line.startsWith("#EXTINF")) {
      const idMatch = line.match(/tvg-id="(.*?)"/);
      const nameMatch = line.match(/tvg-name="(.*?)"/);
      const displayName = line.match(/,(.*)/);
      current = {
        tvgId: idMatch ? idMatch[1] : null,
        name: nameMatch ? nameMatch[1] : (displayName ? displayName[1].trim() : "Unnamed"),
      };
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      channels.push(current);
      current = {};
    }
  }
  return channels;
};

// Format time nicely
const formatEPGTime = (start) => {
  const date = new Date(start);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function App() {
  const [channels, setChannels] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [epgData, setEpgData] = useState([]);
  const epgListRef = useRef(null);

  // Load channels from local .m3u
  useEffect(() => {
    const loadChannels = async () => {
      const res = await fetch("https://abelo-123.github.io/proxt/channels.m3u");
      const text = await res.text();
      const parsedChannels = parseM3U(text);
      setChannels(parsedChannels);
    };
    loadChannels();
  }, []);

  // Load EPG data when a channel is selected
  useEffect(() => {
    const loadEPG = async () => {
      if (!selectedChannelId) return;

      try {
        const res = await axios.get(`https://proxt-tv.onrender.com/epg?channel=${selectedChannelId}&format=json`);
        setEpgData(res.data.programmes || []);
      } catch (error) {
        console.error("Error loading EPG:", error);
        setEpgData([]);
      }
    };
    loadEPG();
  }, [selectedChannelId]);

  useEffect(() => {
    if (epgListRef.current) {
      const currentProgram = epgListRef.current.querySelector(".current-program");
      if (currentProgram) {
        currentProgram.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [epgData]);

  const parseEPGDate = (epgTime) => {
    // Remove timezone offset (e.g., +0000)
    const clean = epgTime.split(" ")[0];
  
    // Format: YYYYMMDDHHmmss
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6) - 1; // JS months are 0-indexed
    const day = clean.slice(6, 8);
    const hour = clean.slice(8, 10);
    const minute = clean.slice(10, 12);
    const second = clean.slice(12, 14);
  
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  };
  
  const formatEPGTime = (epgTime) => {
    const date = parseEPGDate(epgTime);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isProgramPlaying = (start, stop) => {
    const now = new Date();
    const startTime = parseEPGDate(start);
    const stopTime = parseEPGDate(stop);
    return now >= startTime && now <= stopTime;
  };

  const handleChannelClick = (ch) => {
    setCurrentStream(`https://proxt-tv.onrender.com/proxy?url=${encodeURIComponent(ch.url)}`);
    setSelectedChannelId(ch.tvgId);
  };

  return (
    <div style={{ display: 'block', height: '100vh' }}>
      {/* Channel list */}
<div style={{height:'20rem', overflow:'scroll'}}>
      <div style={{ width: '340px', overflowY: 'auto', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <h3>Channels</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {channels.map((ch, idx) => (
            <li key={idx} style={{ marginBottom: '12px' }}>
              <button
                onClick={() => handleChannelClick(ch)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem',
                  background: selectedChannelId === ch.tvgId ? '#e3f2fd' : '#f8f8f8',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <strong>{ch.name}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        {currentStream ? (
          <>
            <VideoPlayer src={currentStream} />
            <div style={{ marginTop: '1rem' }}>
              <h4>Program Schedule</h4>
              {epgData.length ? (
                <ul
                  ref={epgListRef}
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  {epgData.map((prog, idx) => (
                    <li
                      key={idx}
                      className={isProgramPlaying(prog.start, prog.stop) ? "current-program" : ""}
                      style={{
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        backgroundColor: isProgramPlaying(prog.start, prog.stop) ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.3s',
                      }}
                    >
                      <strong>{formatEPGTime(prog.start)} → {formatEPGTime(prog.stop)}</strong>
                      <br />
                      📺 <strong>{prog.title}</strong> {prog.subTitle && `– ${prog.subTitle}`}<br />
                      <em>{prog.desc}</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No EPG data for this channel.</p>
              )}
            </div>
          </>
        ) : (
          <p>Select a channel to start watching</p>
        )}
      </div>
    </div>
  );
}

export default App;
