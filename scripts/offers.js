
import { animateCounter } from './counters.js';

let ALL = [];
let MAP, MARKERS = [];

async function loadOffers(){
  const res = await fetch('https://script.google.com/macros/s/AKfycbwxSBWlzZj9QsNrLV0OTAMY92rcfWaia1QnfuwgOYiEeo-IRx6EKFX1Ui2veC-lL6Od1Q/exec', {
  headers: { 'Cache-Control': 'no-cache' }
});

  ALL = await res.json();
  renderOffers(ALL);
  updateTotals(ALL);
  addMarkers(ALL);
}

function updateTotals(items){
  const meals = items.reduce((a,b)=>a+(b.qty||1),0);
  const kg = Math.round(meals * 0.5);
  animateCounter(document.querySelector('#mealsSaved'), meals+5000);
  animateCounter(document.querySelector('#kgSaved'), kg+2000);
}

function offerCard(o){
  return `
  <article class="offer">
    <img src="${o.image}" alt="${o.item}">
    <div class="body">
      <h3>${o.name}</h3>
      <div class="row"><span>${o.item}</span><span class="tag">${o.city}</span></div>
      <div class="row">
        <div><span class="price">AED ${o.price_after}</span>
        ${o.price_before?`<span class="strike">AED ${o.price_before}</span>`:''}</div>
        <a class="btn" href="#">Get Deal</a>
      </div>
      <div class="row"><small>Pickup: ${o.pickup_start}–${o.pickup_end}</small>
      <small>${o.cuisine}${o.veg?' • Veg':''}${o.halal?' • Halal':''}</small></div>
    </div>
  </article>`;
}

function renderOffers(items){
  const grid = document.querySelector('#offerGrid');
  grid.innerHTML = items.map(offerCard).join('');
}

function applyFilters(){
  const cuisine = document.querySelector('#fCuisine').value;
  const type = document.querySelector('#fType').value;
  const max = parseFloat(document.querySelector('#fPrice').value || '999');
  let list = ALL.slice();
  if (cuisine !== 'all') list = list.filter(x=> (x.cuisine||'').toLowerCase().includes(cuisine));
  if (type !== 'all') {
    if (type==='veg') list = list.filter(x=>x.veg);
    if (type==='halal') list = list.filter(x=>x.halal);
  }
  list = list.filter(x=> (x.price_after||0) <= max);
  renderOffers(list);
  refreshMarkers(list);
}

function initMap(){
  MAP = L.map('map').setView([25.2048, 55.2708], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(MAP);

  if ('geolocation' in navigator){
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      MAP.setView([latitude, longitude], 14);
      L.circleMarker([latitude, longitude], {radius:6}).addTo(MAP).bindPopup('You are here');
    });
  }
}

function addMarkers(items){
  MARKERS.forEach(m=>MAP.removeLayer(m));
  MARKERS = items.map(o=>{
    const m = L.marker([o.lat, o.lng]).addTo(MAP);
    m.bindPopup(`<strong>${o.name}</strong><br>${o.item}<br>AED ${o.price_after}`);
    return m;
  });
}

function refreshMarkers(items){
  MARKERS.forEach(m=>MAP.removeLayer(m));
  addMarkers(items);
}

document.addEventListener('DOMContentLoaded', ()=>{
  initMap();
  loadOffers();
  document.querySelectorAll('.filters select').forEach(el=>el.addEventListener('change', applyFilters));
  document.querySelector('#fPrice').addEventListener('input', applyFilters);
});
