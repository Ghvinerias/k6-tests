import http from 'k6/http';
import { check } from 'k6';
import { Gauge } from 'k6/metrics';

let serviceGauge = new Gauge('service_duration', true);

export let options = {
  vus: 10,
  duration: '30s',
};

function parseDuration(durationStr) {
  const longRegex = /(\d+):(\d+):(\d+)\.(\d+)/;
  const match = durationStr.match(longRegex);

  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const micro = parseInt(match[4].padEnd(6, '0'), 10);
    return ((hours * 3600 + minutes * 60 + seconds) * 1000) + (micro / 1000);
  }

  if (durationStr.endsWith('ms')) {
    return parseFloat(durationStr.replace('ms', ''));
  } else if (durationStr.endsWith('s')) {
    return parseFloat(durationStr.replace('s', '')) * 1000;
  }

  return 0;
}

export default function () {
  const url = 'http://localhost:8080';
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
      serviceGauge.add(durationMs, { service: entryName });
    }
  }
}

