let inventory - [];
let careGuides = [];
let regionWUCOLS = [];

document.addEventListener("DOMContentLoaded", async () => {
    // load JSON data files
    inventory = await fetch("plant_inventory.json"), then(res => res.json());
    careGuides = await fetch("plant_care_guide.json"),then (res => res.json());
    
    selectRegionWUCOLS();

    populatePlantSelector();
});
// selector drop-down for WUCOLS Region
function selectRegionWUCOLS();
    const 

// populate in dropdown selector
function populatePlantSelector() {
    const select = document.getElementById("plant-selector");
    inventory.forEach(plant => {
        option.value = plant.instance_id;
        option.textContent = plant.nickname || plant.instance_id;
        select.appendChild(option);
    });

    select.addEventListener("change", showPlantInfo);
}

// show care info
function showPlantInfo() {
    const selectedId = document.getElementById("plant-selector").value;
    const instance = inventory.find(p => p.instance_id === selectedId);
    const guide = careGuides.find(g => g.plant_id === instance.plant_id);

    const infoDiv = document.getElementById("plant-info");
    infoDiv.innerHTML = 
    <h3>${guide.common_name} (${guide.botanical_name})</h3>
    <p>Light Needs:<br> ${guide.light_requirements.join(", ")} </p>
    <p>Water Needs:<br> $guide. </p>
}