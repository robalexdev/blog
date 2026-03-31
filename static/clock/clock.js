/**
    (c) Robert Alexander
    MIT License
*/
const atoz = "abcdefghijklmnopqrstuvwxyz";
var uniqueId = "";
while (uniqueId.length < 12) {
    uniqueId += atoz[Math.floor(Math.random() * atoz.length)];
}

const timestamps = {};
const timings = {};
const offsets = {};
const serverDelay = {};

// High precision network request timing
const resourceObserver = new PerformanceObserver((p) => {
  for (const entry of p.getEntries()) {
    if (entry.name.includes("/does-not-exist-")) {
      timings['http'] = [
        entry.requestStart,
        entry.responseStart,
      ];
    } else if (entry.name.includes("/zero")) {
      timings['fastly'] = [
        entry.requestStart,
        entry.responseStart,
      ];
    }
  }
  if (timings.length >= 2) {
    resourceObserver.disconnect();
  }
});
resourceObserver.observe({ type: "resource" });

const fetchAndTimeHeader = function(url, headerName) {
  return fetch(
    new Request(url),
    { method: "HEAD" },
  ).then(
    async (response) => response.headers.get(headerName)
  );
};

/**

    HTTP Date header clock synchronization
    This will only be accurate if:
    - the server provides the current time on 404 Error
    - the server actually has the right time
    Ideally, the server should know it is acting as a time server and provide SLAs
*/

const outputDiv = document.querySelector("#the-time");
const offsetDiv = document.querySelector("#the-offset");
const accuracyDiv = document.querySelector("#the-accuracy");

fetchAndTimeHeader("does-not-exist-" + uniqueId, "date").then((tsHeader) => {
  var timestamp = new Date(tsHeader);
  // The timestamp is rounded downward, add 500ms to compensate
  timestamps['http'] = new Date(timestamp.getTime() + 500);
  return;
});

const httpWait = function() {
  const timing = timings['http'];
  const timestamp = timestamps['http'];

  if (timing !== undefined && timestamp !== undefined) {
    const start = performance.timeOrigin + timing[0];
    const end   = performance.timeOrigin + timing[1];

    const rtt = end - start;
    const halfRtt = rtt / 2;
    const errorRounding = 500;

    // A guess for the maximum clock offset a GitHub Pages web server can have
    const errorServer = 100;
    const errorNetwork = halfRtt;
    const errorSeconds = ((errorRounding + errorServer + errorNetwork) / 1000).toFixed(1);

    // Note: NTP also accounts for server delay, but we consider that part of network delay
    const offset = end - timestamp - halfRtt;
    offsets['http'] = offset;

    var offsetText = "synchronized";
    if (offset < -1000 * errorSeconds) {
        offsetText = Math.abs(offset/1000).toFixed(1) + " seconds behind";
    } else if (offset > 1000 * errorSeconds) {
        offsetText = Math.abs(offset/1000).toFixed(1) + " seconds ahead";
    }

    offsetDiv.innerText = "Your device's clock is " + offsetText;
    accuracyDiv.innerText = "Calculated offset is " + (offset/1000).toFixed(1) + " ±" + errorSeconds + " seconds";
    setInterval(() => {
      const local = new Date();
      const now = new Date(local.getTime() + offset);
      outputDiv.innerText = now.toLocaleTimeString();
    }, 50);
  } else {
    // Try again
    setTimeout(httpWait, 80);
  }
};

setTimeout(httpWait, 80);


/**
    High precision clock synchronization using Fastly X-Timer

    Uses an empty file which will ideally remain in the cache
    Ideally, Fastly should acknowledge it's role as a time server and provide SLAs
    before this is used for anything serious
*/
const output2Div = document.querySelector("#the-time-2");
const offset2Div = document.querySelector("#the-offset-2");
const accuracy2Div = document.querySelector("#the-accuracy-2");

fetchAndTimeHeader("zero?r=" + uniqueId, "x-timer").then((tsHeader) => {
  // I.E.: S1773690070.994529,VS0,VE6
  if (!tsHeader) {
    output2Div.innerText = "Failed: no x-timer header";
    return;
  }

  var parts = tsHeader.split(',');
  var unixStartTimeSeconds = 0;
  var durationMilliseconds = 0;
  for (part of parts) {
    if (part.startsWith("S")) {
      unixStartTimeSeconds = Number(part.slice(1));
    } else if (part.startsWith("VE")) {
      durationMilliseconds = Number(part.slice(2));
    }
  }

  serverDelay['fastly'] = durationMilliseconds;
  timestamps['fastly'] = new Date(unixStartTimeSeconds*1000);
  return;
});

const fastlyWait = function() {
  const timing = timings['fastly'];
  const timestamp = timestamps['fastly'];
  const durationMilliseconds = serverDelay['fastly'];

  if (timing !== undefined && timestamp !== undefined) {
    const start = performance.timeOrigin + timing[0];
    const end   = performance.timeOrigin + timing[1];

    const rtt = end - start;
    const halfRtt = rtt / 2;

    // A guess for the maximum clock offset a Fastly server can have
    const errorServer = 100;
    const errorNetwork = halfRtt;
    const errorSeconds = ((errorServer + errorNetwork) / 1000).toFixed(1);
    const offset = end - timestamp + durationMilliseconds - halfRtt;
    offsets['fastly'] = offset;

    var offsetText = "synchronized";
    if (offset < -1000 * errorSeconds) {
        offsetText = Math.abs(offset/1000).toFixed(1) + " seconds behind";
    } else if (offset > 1000 * errorSeconds) {
        offsetText = Math.abs(offset/1000).toFixed(1) + " seconds ahead";
    }

    offset2Div.innerText = "Your device's clock is " + offsetText;
    accuracy2Div.innerText = "Calculated offset is " + (offset/1000).toFixed(1) + " ±" + errorSeconds + " seconds";

    setInterval(() => {
        const local = new Date();
        const now = new Date(local.getTime() + offset);
        output2Div.innerText = now.toLocaleTimeString();
    }, 50);
  } else {
    // Try again
    setTimeout(fastlyWait, 80);
  }
};

setTimeout(fastlyWait, 80);

const offsetComparedDiv = document.querySelector("#the-delta");
const bothWait = function() {
  const httpOffset = offsets['http'];
  const fastlyOffset = offsets['fastly'];

  if (httpOffset !== undefined && fastlyOffset !== undefined) {
    offsetComparedDiv.innerText = "Offsets are " + (httpOffset - fastlyOffset)/1000 + " seconds apart";
  } else {
    setTimeout(bothWait, 100);
  }
};

if (offsetComparedDiv) {
  setTimeout(bothWait, 100);
}

