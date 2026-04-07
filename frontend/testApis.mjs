import fetch from 'node-fetch';

const USGS_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const RELIEFWEB_API = 'https://api.reliefweb.int/v1/disasters?appname=crisis_management&profile=full&preset=latest&limit=15&query[value]=status:current';

async function testAPIs() {
    console.log("Testing USGS...");
    try {
        const u = await fetch(USGS_API);
        const data = await u.json();
        console.log("USGS:", data.features.length);
    } catch(e) { console.log(e.message) }

    console.log("Testing RELIEFWEB...");
    try {
        const r = await fetch(RELIEFWEB_API);
        const data = await r.json();
        console.log("RELIEFWEB:", data.data.length);
    } catch(e) { console.log(e.message) }
}
testAPIs();
