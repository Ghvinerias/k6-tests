import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

let serviceDuration = new Trend('service_duration', true); // enable tags

export let options = {
  vus: 1,
  duration: '10s',
};

function parseDuration(durationStr) {
  const regex = /(\d+):(\d+):(\d+)\.(\d+)/;
  const match = durationStr.match(regex);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const micro = parseInt(match[4].padEnd(6, '0'), 10); // pad microseconds

  return ((hours * 3600 + minutes * 60 + seconds) * 1000) + (micro / 1000); // in ms
}

export default function () {
  const url = 'http://localhost:8080'; // your local Go API
  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  let response;
  try {
    response = JSON.parse(res.body);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    return;
  }

  const entries = response.entries || response.Entries;

  for (const entryName in entries) {
    if (!entries.hasOwnProperty(entryName)) continue;

    const entry = entries[entryName];
    const durationStr = entry.duration || entry.Duration;

    if (durationStr) {
      const durationMs = parseDuration(durationStr);
      serviceDuration.add(durationMs, { service: entryName });
    }
  }
}

