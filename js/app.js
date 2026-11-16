const $ = (s) => document.querySelector(s);
const grid = $("#destinationGrid");
const countrySelect = $("#countrySelect");
let activeRegion = "All";
let activeTier = "budget";

let displayCurrency = "USD";
const USD_TO_INR = 94.12;

const money = n => new Intl.NumberFormat(
  displayCurrency === "INR" ? "en-IN" : "en-US",
  {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0
  }
).format(displayCurrency === "INR" ? n * USD_TO_INR : n);
const titleCase = s => s.charAt(0).toUpperCase()+s.slice(1);

function renderCards(){
  const q = $("#searchInput").value.trim().toLowerCase();
  const list = countries.filter(c => (activeRegion==="All" || c.region===activeRegion) && (c.name.toLowerCase().includes(q)||c.tagline.toLowerCase().includes(q)));
  grid.innerHTML = list.length ? list.map(c=>`
    <article class="destination-card" tabindex="0" role="button" data-id="${c.id}" aria-label="Explore ${c.name}">
      <div class="destination-photo" style="background-image:url('${c.image}')"><span class="region-tag">${c.region}</span></div>
      <div class="destination-info"><h3>${c.name}</h3><p>${c.tagline}</p><div class="card-bottom"><span>${c.bestTime}</span><strong>Explore guide ↗</strong></div></div>
    </article>`).join("") : `<div class="empty-state">No destinations found. Try another search.</div>`;
}
function fillSelect(){
  countrySelect.innerHTML = countries.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}
function getSelected(){ return countries.find(c=>c.id===countrySelect.value) || countries[0]; }
function calculate(){
  const c=getSelected();
  const days=Math.max(1,Math.min(90,Number($("#daysInput").value)||1));
  const travelers=Math.max(1,Math.min(20,Number($("#travelersInput").value)||1));
  $("#daysInput").value=days; $("#travelersInput").value=travelers;
  const p=c.prices[activeTier];
  // Hotel is per room/night; other categories are per person/day.
  const costs={
    Hotels:p.hotel*days,
    Transport:p.transport*days*travelers,
    Food:p.food*days*travelers,
    Activities:p.activities*days*travelers,
    "Site & museum fees":p.entry*days*travelers
  };
  const total=Object.values(costs).reduce((a,b)=>a+b,0);
  $("#totalCost").textContent=money(total);
  $("#perPerson").textContent=`Approx. ${money(total/travelers)} per traveler · ${titleCase(activeTier)} style`;
  $("#estimateMeta").textContent=`${days} days · ${travelers} ${travelers===1?"traveler":"travelers"}`;
  $("#costBreakdown").innerHTML=Object.entries(costs).map(([k,v])=>`<div class="cost-row"><span>${k}</span><strong>${money(v)}</strong></div>`).join("");
  return {country:c.name,days,travelers,tier:titleCase(activeTier),costs,total};
}
function showCountry(id){
  const c=countries.find(x=>x.id===id); if(!c)return;
  $("#modalCover").style.backgroundImage=`url('${c.image}')`;
  $("#modalRegion").textContent=`${c.region} · DESTINATION GUIDE`;
  $("#modalTitle").textContent=c.name;
  $("#modalDescription").textContent=c.description;
  $("#modalFacts").innerHTML=[
    ["Capital",c.capital],["Currency",c.currency],["Language",c.language],["Best time",c.bestTime],["Local food",c.food[0]],["Getting around",c.transport[0]]
  ].map(([a,b])=>`<div class="fact"><small>${a}</small><strong>${b}</strong></div>`).join("");
  $("#modalPlaces").innerHTML=c.places.map(x=>`<span>${x}</span>`).join("");
  $("#modalHighlights").innerHTML=[
    ["Food to try",c.food.join(" · ")],["Transport",c.transport.join(" · ")],["Culture",c.culture]
  ].map(([a,b])=>`<div class="highlight"><strong>${a}</strong><br>${b}</div>`).join("");
  $("#countryMap").src=`https://www.google.com/maps?q=${encodeURIComponent(c.map)}&output=embed`;
  $("#countrySelect").value=c.id; calculate();
  const modal=$("#countryModal"); modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
}
function closeModal(){const m=$("#countryModal");m.classList.remove("open");m.setAttribute("aria-hidden","true");document.body.style.overflow="";}
grid.addEventListener("click",e=>{const card=e.target.closest(".destination-card");if(card)showCountry(card.dataset.id);});
grid.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches(".destination-card")){e.preventDefault();showCountry(e.target.dataset.id);}});
$("#searchInput").addEventListener("input",renderCards);
$("#regionFilters").addEventListener("click",e=>{const b=e.target.closest("button[data-region]");if(!b)return;activeRegion=b.dataset.region;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderCards();});
$("#modalClose").addEventListener("click",closeModal);
$("#countryModal").addEventListener("click",e=>{if(e.target.id==="countryModal")closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("#modalPlan").addEventListener("click",closeModal);
document.querySelectorAll(".tier").forEach(b=>b.addEventListener("click",()=>{activeTier=b.dataset.tier;document.querySelectorAll(".tier").forEach(x=>x.classList.toggle("active",x===b));calculate();}));
["countrySelect","daysInput","travelersInput"].forEach(id=>$("#"+id).addEventListener("input",calculate));
$("#currencySelect").addEventListener("change", e => {
  displayCurrency = e.target.value;
  calculate();
});
function step(id,delta,min,max){const el=$("#"+id);el.value=Math.max(min,Math.min(max,(Number(el.value)||min)+delta));calculate();}
$("#daysMinus").addEventListener("click",()=>step("daysInput",-1,1,90));
$("#daysPlus").addEventListener("click",()=>step("daysInput",1,1,90));
$("#travMinus").addEventListener("click",()=>step("travelersInput",-1,1,20));
$("#travPlus").addEventListener("click",()=>step("travelersInput",1,1,20));
$("#copyEstimate").addEventListener("click",async()=>{
 const r=calculate();
 const lines=[`TravelWise estimate — ${r.country}`,`${r.days} days · ${r.travelers} traveler(s) · ${r.tier}`, ...Object.entries(r.costs).map(([k,v])=>`${k}: ${money(v)}`),`Estimated total: ${money(r.total)}`,"Planning estimate only; actual prices vary."].join("\n");
 try{await navigator.clipboard.writeText(lines);$("#copyEstimate").innerHTML="Copied ✓";setTimeout(()=>$("#copyEstimate").innerHTML='Copy my estimate <span>↗</span>',1800);}
 catch{window.prompt("Copy your estimate:",lines);}
});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
$("#year").textContent=new Date().getFullYear();
fillSelect();renderCards();calculate();
