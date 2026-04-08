const SNAPSERVER_HOST = "10.0.0.12:1780";


const meta = {
  author: "Óscar Martín Flores",
  company: "Proviox",
  email: "proviox@protovision.es",
  web: "proviox.protovision.es",
  github: "https://github.com/omartinflores",
  linkedin: "https://www.linkedin.com/in/omartinflores/",
} as const;

const keys = {
  snapserver_host: "snapserver.host",
  theme: "theme",
  showoffline: "showoffline"
}

enum Theme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

function setPersistentValue(key: string, value: string) {
  if (window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

function getPersistentValue(key: string, defaultValue: string = ""): string {
  if (window.localStorage) {
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      return value;
    }
    window.localStorage.setItem(key, defaultValue);
    return defaultValue;
  }
  return defaultValue;
}

function normalizeSocketUrl(baseUrl: string): string {
  try {
    const parsed = new URL(baseUrl);
    // Ensure websocket protocol for snapserver connections
    if (parsed.protocol === "http:" || parsed.protocol === "ws:") {
      parsed.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    } else if (parsed.protocol === "https:" || parsed.protocol === "wss:") {
      parsed.protocol = "wss:";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    // Fallback if not a full URL
    try {
      const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
      const parsed = new URL(protocol + baseUrl);
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return baseUrl.replace(/\/$/, "");
    }
  }
}


const config = {

  get baseUrl() {
    return normalizeSocketUrl(SNAPSERVER_HOST);
  },


  set baseUrl(value) {
    setPersistentValue(keys.snapserver_host, value);
  },
  get theme() {
    return getPersistentValue(keys.theme, Theme.System.toString()) as Theme;
  },
  set theme(value: Theme) {
    setPersistentValue(keys.theme, value);
  },
  get showOffline() {
    return getPersistentValue(keys.showoffline, String(false)) === String(true);
  },
  set showOffline(value: boolean) {
    setPersistentValue(keys.showoffline, String(value));
  }
};


export { config, meta, getPersistentValue, setPersistentValue, Theme };
