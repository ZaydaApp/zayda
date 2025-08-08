// scripts/offers.js — Live Google Sheet Data
let ALL = [];
let MAP, MARKERS = [];

async function loadOffers() {
  const url = 'https://script.google.com/macros/s/AKfycbw5kGhkGdPWPayPa48O4TdmHxkhsZ0Tir1gXpMjn_18HilaXglS7nS__HvI_6zeT11K9g/exec';
  const res = await fetch(url + '?v=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' }});
  if (!res.ok) throw new Error('Failed to load offers');
  const data = await res.json();
  console.log('Loaded offers:', data);
  return Array.isArray(data) ? data : [];
}


function offerCard(o){
  return `
  <article class="offer">
    <img src="${o.image}" alt="${o.item}" onerror="this.style.display='none'">
    <div class="body">
      <h3>${o.name}</h3>
      <div class="row"><span>${o.item}</span><span class="tag">${o.city||''}</span></div>
      <div class="row">
        <div>
          <span class="price">AED ${o.price_after}</span>
          ${o.price_before ? `<span class="strike">AED ${o.price_before}</span>` : ''}
        </div>
        <a class="btn" href="#">Get Deal</a>
      </div>
      <div class="row">
        <small>Pickup: ${o.pickup_start}–${o.pickup_end}</small>
        <small>${o.cuisine||''}${o.veg?' • Veg':''}${o.halal?' • Halal':''}</small>
      </div>
    </div>
  </article>`;
}

function renderOffers(items){
  const grid = document.querySelector('#offerGrid');
  if (!grid) return;
  if (!items.length){
    grid.innerHTML = '<p class="small">No live offers yet. Add rows in your Google Sheet.</p>';
    return;
  }
  grid.innerHTML = items.map(offerCard).join('');
}

function initMap(){
  const mapEl = document.getElementById('map');
  if (!mapEl) return;
  MAP = L.map('map').setView([25.2048, 55.2708], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(MAP);
  if ('geolocation' in navigator){
    navigator.geolocation.getCurrentPosition(pos=>{
      const { latitude, longitude } = pos.coords;
      MAP.setView([latitude, longitude], 14);
      L.circleMarker([latitude, longitude], { radius: 6 }).addTo(MAP).bindPopup('You are here');
    });
  }
}

function setMarkers(items){
  if (!MAP) return;
  if (window.MARKERS && window.MARKERS.length) window.MARKERS.forEach(m=>MAP.removeLayer(m));
  window.MARKERS = (items||[]).filter(o=>o.lat && o.lng).map(o=>{
    const m = L.marker([Number(o.lat), Number(o.lng)]).addTo(MAP);
    m.bindPopup(`<strong>${o.name}</strong><br>${o.item}<br>AED ${o.price_after}`);
    return m;
  });
}

function applyFilters(){
  if (!ALL.length) return;
  const cuisine = (document.querySelector('#fCuisine')?.value || 'all').toLowerCase();
  const type = (document.querySelector('#fType')?.value || 'all').toLowerCase();
  const max = parseFloat(document.querySelector('#fPrice')?.value || '999');
  let list = ALL.slice();
  if (cuisine !== 'all') list = list.filter(x => (x.cuisine||'').toLowerCase().includes(cuisine));
  if (type !== 'all'){
    if (type === 'veg') list = list.filter(x => !!x.veg);
    if (type === 'halal') list = list.filter(x => !!x.halal);
  }
  list = list.filter(x => Number(x.price_after||0) <= max);
  renderOffers(list);
  setMarkers(list);
}

document.addEventListener('DOMContentLoaded', async ()=>{
  initMap();
  try {
    ALL = await loadOffers();
  } catch (e) {
    console.error(e);
    ALL = [];
  }
  renderOffers(ALL);
  setMarkers(ALL);
  document.querySelectorAll('.filters select').forEach(el=>el.addEventListener('change', applyFilters));
  const priceEl = document.querySelector('#fPrice'); if (priceEl) priceEl.addEventListener('input', applyFilters);
});
