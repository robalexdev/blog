// Static-hosted clock offset estimation
// (c) Robert Alexander 2026
// License: MIT

function dbg(msg) {
  const d = document.querySelector("#debug");
  if (!d) return;
  const p = document.createElement("p");
  p.innerText = msg;
  d.appendChild(p);
}

// Network request timer
const resourceTimingCallbacks = {};
const resourceObserver = new PerformanceObserver((p) => {
  for (const entry of p.getEntries()) {
    for (const [name, cb] of Object.entries(resourceTimingCallbacks)) {
      if (entry.name.includes(name)) {
        dbg("Got timing information for " + entry.name);
        cb(entry);
      }
    }
  }
});
resourceObserver.observe({ type: "resource" });

function done() {
  resourceObserver.disconnect();
}

const fetchTime = function(url) {
  dbg("Fetching " + url);
  return fetch(
    new Request(url),
    {
      method: "HEAD",
      cache:  "no-store",
    },
  );
};

function uniq() {
  const atoz = "abcdefghijklmnopqrstuvwxyz";
  var uniqueId = "";
  while (uniqueId.length < 12) {
      uniqueId += atoz[Math.floor(Math.random() * atoz.length)];
  }
  return uniqueId;
}

async function estimateSystemClockOffset(pathPrefix, addRandomSuffix, fHeader) {
  var path = pathPrefix;
  if (addRandomSuffix) {
    path += uniq();
  }
  const waitForTiming = new Promise((resolve, reject) => {
    resourceTimingCallbacks[path] = resolve;
  });
  const [serverTimestamp, delay, extraError] = fHeader(await fetchTime(path));
  dbg("Server Timestamp: " + serverTimestamp);
  if (serverTimestamp === null) {
    return [null, null, null];
  }
  const timing = await waitForTiming;
  const [offset, error] = calculateOffset(timing, serverTimestamp, delay, extraError);
  return [timing, offset, error];
}

function calculateOffset(timing, serverTimestamp, serverDelay, extraError) {
  // Get the current time from both the performance clock and the system clock
  // These are usually aligned, but not always
  const systemTimeReferenceMs = new Date().getTime();
  const perfTimeReferenceMs = performance.now();

  // Walk the system clock back to the request end timestamp
  // This is extra delay added by the performance callback
  const callbackDelayMs = perfTimeReferenceMs - timing.responseEnd;
  const systemTimeAtRequestEndMs = systemTimeReferenceMs - callbackDelayMs;

  //
  // Estimate how long before request end the server generated the timestamp
  // This assumes network delay is symmetric
  //
  const rtt = timing.responseEnd - timing.requestStart;
  const halfRtt = rtt / 2;

  // The Fastly timestamp is taken at the start of the server processing time
  // So walk back by an extra half the server processing time
  const offset = systemTimeAtRequestEndMs - serverTimestamp - halfRtt - (serverDelay/2);
  const error = halfRtt + extraError;

  return [offset, error];
}

// See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Date
async function estimateSystemClockOffsetUsingHTTP() {
  const result = await estimateSystemClockOffset(
    "does-not-exist-",
    true,
    (r) => { 
      const ts = r.headers.get("date");
      // The Date header timestamp is rounded downward
      // add 500ms to compensate
      const timestamp = new Date(ts).getTime() + 500;
      const delay = 0; // No data provided
      return [timestamp, delay, 500];
    },
  );
  dbg("HTTP results: " + result);
  return result;
}

// See: https://www.fastly.com/documentation/reference/http/http-headers/X-Timer/
async function estimateSystemClockOffsetUsingXTimer() {
  const result = await estimateSystemClockOffset(
    "zero",
    false,
    (r) => { 
      const headerValue = r.headers.get("x-timer");
      if (! headerValue) {
        return [ null, null, null ];
      }
      var parts = headerValue.split(',');
      var unixStartTimeSeconds = null;
      var durationMilliseconds = null;
      for (part of parts) {
        if (part.startsWith("S")) {
          unixStartTimeSeconds = Number(part.slice(1));
        } else if (part.startsWith("VE")) {
          durationMilliseconds = Number(part.slice(2));
        }
      }
      return [ unixStartTimeSeconds*1000, durationMilliseconds, 1 ];
    },
  );
  dbg("X-Timer results: " + result);
  return result;
}

async function estimateSystemClockOffsetUsingCF() {
  const result = await estimateSystemClockOffset(
    "zero",
    false,
    (r) => { 

      const headerValue = r.headers.get("x-alexsci-timer");
      if (! headerValue) {
        return [ null, null, null ];
      }
      const parts = headerValue.split(" ");
      const timestampMSecs = Number(parts[0]) * 1000 + Number(parts[1]);
      const edgeMSecs = Number(parts[2]);

      if (timestampMSecs < 1700000000000) {
        return [ null, null, null ];
      }

      return [ timestampMSecs, edgeMSecs, 1 ];
    },
  );
  dbg("CF results: " + result);
  return result;
}
