// Static-hosted web clocks
// (c) Robert Alexander 2026
// License: MIT

const httpClockElem = document.querySelector("#http-clock");
const fastlyClockElem = document.querySelector("#fastly-clock");
const cloudflareClockElem = document.querySelector("#cloudflare-clock");

function updateClockDisplay(offset, div) {
  return () => {
    const local = new Date();
    const now = new Date(local.getTime() - offset);
    div.innerText = now.toLocaleTimeString();
  };
}

async function loadClock(elem, fn) {
  if (!elem) return;
  const timeDiv = elem.querySelector(".the-time");
  const offsetDiv = elem.querySelector(".the-offset");
  const accuracyDiv = elem.querySelector(".the-accuracy");
  const timelineDiv = elem.querySelector(".the-timeline");

  const [ timing, offset, error ] = await fn();

  if (!!timeDiv) {
    if (!!offset) {
      setInterval(updateClockDisplay(offset, timeDiv), 50);
    } else {
      timeDiv.innerText = "Loading failed";
    }
  }

  if (!!offsetDiv && !!offset) {
    if (Math.abs(offset) > error) {
      if (offset < 0) {
        offsetDiv.innerText = "Your system clock is behind by " + Math.abs(offset/1000).toFixed(2) + " seconds";
      } else {
        offsetDiv.innerText = "Your system clock is ahead by " + (offset/1000).toFixed(2) + " seconds";
      }
    } else {
      offsetDiv.innerText = "Your system clock is synchronized";
    }
  }

  if (!!accuracyDiv && error !== null) {
    accuracyDiv.innerText = "+/- " + (error/1000).toFixed(2) + " seconds";
  }
}

loadClock(httpClockElem, estimateSystemClockOffsetUsingHTTP);
//loadClock(fastlyClockElem, estimateSystemClockOffsetUsingXTimer);
loadClock(cloudflareClockElem, estimateSystemClockOffsetUsingCF);

