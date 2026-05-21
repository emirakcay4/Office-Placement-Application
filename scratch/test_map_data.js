const axios = require('axios');

const baseURL = 'http://127.0.0.1:8000/api';
const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const fetchAllPages = async (endpoint) => {
  let results = [];
  let nextUrl = endpoint;
  while (nextUrl) {
    let relativeUrl = nextUrl;
    if (nextUrl.includes('/api/')) {
      relativeUrl = nextUrl.split('/api')[1];
    }
    console.log("Fetching relativeUrl:", relativeUrl);
    const res = await client.get(relativeUrl);
    const data = res.data;
    if (data && data.results && Array.isArray(data.results)) {
      results = [...results, ...data.results];
      nextUrl = data.next;
    } else if (Array.isArray(data)) {
      results = [...results, ...data];
      nextUrl = null;
    } else {
      nextUrl = null;
    }
  }
  return results;
};

const run = async () => {
  try {
    console.log("Fetching offices...");
    const offData = await fetchAllPages('/offices/search/');
    console.log("Total offices fetched:", offData.length);

    console.log("Fetching assignments...");
    let assignData = [];
    try {
      assignData = await fetchAllPages('/assignments/');
    } catch (e) {
      console.log("Assignments fetch failed (likely unauthenticated):", e.message);
    }
    console.log("Total assignments fetched:", assignData.length);

    console.log("Fetching staff...");
    let staffData = [];
    try {
      staffData = await fetchAllPages('/staff/');
    } catch (e) {
      console.log("Staff fetch failed (likely unauthenticated):", e.message);
    }
    console.log("Total staff fetched:", staffData.length);

    const staffMap = {};
    if (Array.isArray(staffData)) {
      staffData.forEach(s => {
        if (s && s.id) {
          staffMap[s.id] = s;
        }
      });
    }

    const activeAssignments = Array.isArray(assignData) 
      ? assignData.filter(a => a && !a.end_date)
      : [];

    const assignByOffice = {};
    activeAssignments.forEach(a => {
      if (a && a.office) {
        if (!assignByOffice[a.office]) assignByOffice[a.office] = [];
        const p = staffMap[a.staff] || {};
        const title = p.academic_title ? p.academic_title + ' ' : '';
        const name = `${title}${p.first_name || ''} ${p.last_name || ''}`.trim();
        assignByOffice[a.office].push(name || 'Unknown');
      }
    });

    const details = {};
    if (Array.isArray(offData)) {
      offData.forEach(o => {
        if (o && o.room_number) {
          let status = 'available';
          const occupants = o.current_occupants_count || 0;
          if (occupants > o.capacity) status = 'overcapacity';
          else if (occupants === o.capacity) status = 'occupied';
          else if (occupants > 0) status = 'available';
          
          const key = o.room_number.trim().toUpperCase();
          details[key] = {
            occupants: occupants,
            capacity: o.capacity,
            status: status,
            people: assignByOffice[o.id] || []
          };
        }
      });
    }

    console.log("Sample details in map:");
    const keys = Object.keys(details);
    console.log("Total detail keys mapped:", keys.length);
    console.log("Sample keys:", keys.slice(0, 10));
    if (keys.length > 0) {
      console.log("Detail for key:", keys[0], details[keys[0]]);
    }
  } catch (err) {
    console.error("Critical error:", err.message);
  }
};

run();
