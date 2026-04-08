import { useState, useEffect, useRef, useCallback } from 'react';
import ListeningScreen from './ListeningScreen';
import { config, getPersistentValue, setPersistentValue } from "../config";
import { SnapControl } from '../snapcontrol';
import { SnapStream } from '../snapstream';

const silence = new URL('../assets/10-seconds-of-silence.mp3', import.meta.url).href;
const CLIENT_NAME_KEY = 'proviox.client_name';
const DEFAULT_CLIENT_NAME = 'Invitado';

function getSavedClientName(): string {
  return getPersistentValue(CLIENT_NAME_KEY, DEFAULT_CLIENT_NAME);
}

export default function SnapWeb() {
  const serverUrl = config.baseUrl;
  const [clientName, setClientName] = useState(getSavedClientName);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const snapstreamRef = useRef<SnapStream | null>(null);
  const audioRef = useRef(new Audio());
  const snapControlRef = useRef(new SnapControl());

  const updateClientNameOnServer = useCallback((name: string, retries = 10) => {
    try {
      const clientId = SnapStream.getClientId();
      snapControlRef.current.setClientName(clientId, name);
      console.log("Client name updated on server:", clientId, name);
      return;
    } catch (e) {
      if (retries <= 0) {
        console.error("Error updating client name:", e);
        return;
      }
      window.setTimeout(() => updateClientNameOnServer(name, retries - 1), 300);
    }
  }, []);

  // Handle server connection
  useEffect(() => {
    console.debug("serverUrl updated: " + serverUrl);
    snapControlRef.current.connect(serverUrl);
    const connection = snapControlRef.current;
    return () => {
      connection.disconnect();
    };
  }, [serverUrl]);

  snapControlRef.current.onConnectionChanged = (_control: SnapControl, connected: boolean, _error?: string) => {
    console.log("Connection state changed: " + connected);
    if (!connected) {
      setIsPlaying(false);
    }
  };

  // Handle playing state
  useEffect(() => {
    if (isPlaying) {
      console.debug("isPlaying changed to true");
      audioRef.current.src = silence;
      audioRef.current.loop = true;
      audioRef.current.play().then(() => {
        if (!snapstreamRef.current) {
          snapstreamRef.current = new SnapStream(serverUrl);
          setAnalyser(snapstreamRef.current.analyser);
        }
      }).catch((err: unknown) => {
        console.error('Error starting audio playback', err);
        setIsPlaying(false);
      });
    } else {
      console.debug("isPlaying changed to false");
      if (snapstreamRef.current)
        snapstreamRef.current.stop();
      snapstreamRef.current = null;
      setAnalyser(null);
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, [isPlaying, serverUrl]);

  useEffect(() => {
    updateClientNameOnServer(clientName);
  }, [clientName, updateClientNameOnServer]);

  const handleClientNameChange = useCallback((name: string) => {
    console.log("Client name changed:", name);
    setPersistentValue(CLIENT_NAME_KEY, name);
    setClientName(name);
  }, []);

  const handleStopListening = useCallback(() => {
    console.log("Stop listening");
    setIsPlaying(false);
  }, []);

  const handleStartListening = useCallback(() => {
    console.log("Start listening");
    setIsPlaying(true);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <ListeningScreen
        clientName={clientName}
        isPlaying={isPlaying}
        onStart={handleStartListening}
        onStop={handleStopListening}
        onChangeName={handleClientNameChange}
        analyser={analyser}
        metadata={undefined}
      />
    </div>
  );
}

