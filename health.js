import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
 
let serviceTrends = {};
 
export let options = {
  vus: 1,
  duration: '1s',
};
 
function parseDuration(durationStr) {
  const regex = /(\d+):(\d+):(\d+)\.(\d+)/;
  const match = durationStr.match(regex);
  if (!match) return 0;
 
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const micro = parseInt(match[4].padEnd(6, '0'), 10); // pad to microseconds
 
  return ((hours * 3600 + minutes * 60 + seconds) * 1000) + (micro / 1000);
}
 
export default function () {
  const url = 'http://localhost:5678'; // replace with your health check URL
  const res = http.get(url);
 
  check(res, {
    'response is 200': (r) => r.status === 200,
  });
 
  try {
    const data = JSON.parse(res.body);
 
    const entries = data.entries;
    for (const key in entries) {
      const entry = entries[key];
      const durationStr = entry.duration;
 
      if (durationStr) {
        const ms = parseDuration(durationStr);
 
        if (!serviceTrends[key]) {
          serviceTrends[key] = new Trend(key);
        }
 
        serviceTrends[key].add(ms);
      }
    }
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
  }
}
 
