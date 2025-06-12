let inventory       = [];
let careGuide       = [];
let regionWUCOLS    = "";

// DOMContentLoaded = loads JSON files and initializes UI
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // fetch JSON and populate inventory and careGuide
        inventory = await fetch("plant_inventory.json").then(r => r.json());
        careGuide = await fetch("plant_care_guide.json").then(r => r.json());
        
        // UI init & call setup functions
        setupRegionDropdowns(); // WUCOLS region selection
        renderPlantButtons(); // plant buttons generated

    } catch (error) {
        console.error("Error loading data:", error); // console log notice error
        };
    });

// Setup WUCOLS region dropdown -- FIXED the logic errors
function setupRegionDropdowns() {
    const selectRegions = document.querySelectorAll(".select-region");
    selectRegions.forEach((selectRegion) => {
        const selectButton = selectRegion.querySelector(".region-button");
        const dropdown = selectRegion.querySelector(".region-dropdown");
        const options = dropdown.querySelectorAll("li");
        const selectedValue = selectButton.querySelector(".selected-value");

        let focusedIndex = -1;

        const toggleDropdown = (expand = null) => {
            const isOpen = expand !== null ? expand : dropdown.classList.contains("hidden");
            dropdown.classList.toggle("hidden", !isOpen);
            selectButton.setAttribute("aria-expanded", isOpen);

            if (isOpen) {
                focusedIndex = [...options].findIndex((option) =>
                    option.classList.contains("selected")
                );
                focusedIndex = focusedIndex === -1 ? 0 : focusedIndex;
                updateFocus();
            } else {
                focusedIndex = -1;
                selectButton.focus();
            }
        };

        const updateFocus = () => {
            options.forEach((option, index) => {
                if (option) {
                    option.setAttribute("tabindex", index === focusedIndex ? "0" : "-1");
                    if (index === focusedIndex) option.focus();
                }
            });
        };
        // applies selected WUCOLS region to set regionWUCOLS var 
        const handleOptionSelect = (option) => { 
            const value = option.dataset.value;

            // clear prev selected class from the list
            options.forEach((opt) => opt.classList.remove("selected"));

            if (value === "clear") {
                regionWUCOLS = "";
                selectedValue.textContent = "FIRST: Select WUCOLS Region";
                document.getElementById("selected-region-display").textContent = "No region selected";
                options.forEach((opt) => opt.classList.remove("selected"));
                return;
            }

            regionWUCOLS = value;
            selectedValue.textContent = option.textContent.trim();
            document.getElementById("selected-region-display").textContent = 
                regionWUCOLS ? `Selected Region: ${regionWUCOLS}` : "No region selected";

            option.classList.add("selected");
        };

        options.forEach((option) => {
            option.addEventListener("click", () => {
                handleOptionSelect(option);
                toggleDropdown(false);
            });
        });

        selectButton.addEventListener("click", () => {
            toggleDropdown();
        });

        selectButton.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                toggleDropdown(true);
            } else if (event.key === "Escape") {
                toggleDropdown(false);
            }
        });

        dropdown.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                focusedIndex = (focusedIndex + 1) % options.length;
                updateFocus();
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                focusedIndex = (focusedIndex - 1 + options.length) % options.length;
                updateFocus();
            } else if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOptionSelect(options[focusedIndex]);
                toggleDropdown(false);
            } else if (event.key === "Escape") {
                toggleDropdown(false);
            }
        });

        document.addEventListener("click", (event) => {
            const isOutsideClick = !selectRegion.contains(event.target);
            if (isOutsideClick) {
                toggleDropdown(false);
            }
        });
    });
};

// create a button for each plant entry in inventory
function renderPlantButtons() {
    const list = document.getElementById("plant-list");

    // clean slate of prev buttons
    list.innerHTML = "";

    inventory.forEach(inst => {
        const btn = document.createElement("button");
        btn.className           = "plant-button";
    btn.textContent             = inst.nickname || inst.instance_id;
        btn.dataset.instanceId  = inst.instance_id;

        // when clicked, show relevant plant care info:
        btn.addEventListener("click", () => {
            // holster the region in a URL
            const url = new URL("plant.html", window.location.origin);
            url.searchParams.set("instanceId", inst.instance_id);
            if (regionWUCOLS) url.searchParams.set("region", regionWUCOLS);

            window.location.href=url;
    });
        list.appendChild(btn);
    });
}

// display care info for clicked plant entry (incl water use based on WUCOLS region)
function showPlantInfo (instanceId) {
    console.log("showPlantInfo called with", instanceId);
    const inst  = inventory.find(p => p.instance_id === instanceId);
    console.log(" inst ->", inst);
    const guide = careGuide.find(g => g.plant_id === inst.plant_id);
    console.log(" guide ->", guide);

    const info  = document.getElementById("plant-info");
    // validation of care guide info
    if (!guide) {
        return info.innerHTML = `<p>No care guide found for ${instanceId}.</p>`;
    }
    // light req csv to array parse
    const sun = guide.light_req || "";
    const light = sun.split(";").map(s => s.trim()).filter(Boolean);
    // split light req by pref v tol
    const best = light
        .filter(l => l.startsWith("pref_"))
        .map(l => l.replace(/^pref_/,"").replace(/_/g, " "));
    const tolerates = light
        .filter(l => l.startsWith("tol_"))
        .map(l => l.replace(/^tol_/,"").replace(/_/g, " "));
    let lightCare = "";
    if (best.length) {
        lightCare += `Best in ${best.join(", ")}`;
    }
    if (tolerates.length) {
        if(lightCare) lightCare +=", ";
            lightCare += `tolerates ${tolerates.join(", ")}`;
    }
    if (!lightCare) {
        lightCare = "No light requirement data";
    }

    // pull water use based on regionWUCOLS
    const waterUse = regionWUCOLS
    ? guide[regionWUCOLS] || "N/A"
    : "Select a region first";

    info.innerHTML = `
    <h2>${inst.nickname || inst.instance_id}</h2>
    <p>Botanical: ${guide.botanical_name}</p>
    <p>Light Req: ${lightCare}</p>
    <p>Water in Region ${regionWUCOLS.slice(-1)}: ${waterUse}</p>
    <p>Notes: ${guide.notes || "no notes"}</p>
    `;
}