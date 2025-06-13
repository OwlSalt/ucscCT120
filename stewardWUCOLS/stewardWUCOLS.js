let inventory       = [];
let careGuide       = [];
let regionWUCOLS    = "";

// DOMContentLoaded = loads JSON files and initializes UI
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) Load data
    inventory = await fetch("plant_inventory.json").then(r => r.json());
    careGuide = await fetch("plant_care_guide.json").then(r => r.json());

    // 2) Restore from localStorage
    const saved = localStorage.getItem("regionWUCOLS");
    if (saved) regionWUCOLS = saved;

    // 3) Parse URL params
    const params     = new URLSearchParams(window.location.search);
    const instanceId = params.get("instanceId");
    const regionKey  = params.get("region");
    if (regionKey) {
      regionWUCOLS = regionKey;
      localStorage.setItem("regionWUCOLS", regionWUCOLS);
    }

    // 4) If on the *index* page, build its UI
    if (document.getElementById("plant-list")) {
      setupRegionDropdowns();
      renderPlantButtons();
    }

    // 5) on the *detail* page, hide list UI and show info
    if (document.getElementById("plant-info") && instanceId) {
      // hide list and dropdown if they exist (they won’t on plant.html)
      document.getElementById("plant-list")?.style &&
        (document.getElementById("plant-list").style.display = "none");
      document.querySelector(".select-region")?.style &&
        (document.querySelector(".select-region").style.display = "none");

      // now that data and regionWUCOLS are set, render the detail
      showPlantInfo(instanceId);
    }

  } catch (err) {
    console.error("Error loading data", err);
  }
});

// Setup WUCOLS region dropdown -- FIXED the logic errors
function setupRegionDropdowns() {
  const wrappers = document.querySelectorAll(".select-region");
  wrappers.forEach(wrapper => {
    const selectButton  = wrapper.querySelector(".region-button");
    const dropdown      = wrapper.querySelector(".region-dropdown");
    const options       = dropdown.querySelectorAll("li");
    const selectedValue = selectButton.querySelector(".selected-value");

    // Pre-select saved region:
    if (regionWUCOLS) {
      const sel = dropdown.querySelector(`li[data-value="${regionWUCOLS}"]`);
      if (sel) {
        sel.classList.add("selected");
        selectedValue.textContent = sel.textContent.trim();
      }
    }


    let focusedIndex = -1;
    const toggleDropdown = (open = null) => {
      const isOpen = open !== null ? open : !dropdown.classList.contains("hidden");
      dropdown.classList.toggle("hidden", !isOpen);
      selectButton.setAttribute("aria-expanded", isOpen);
      if (isOpen) {
        focusedIndex = [...options].findIndex(o => o.classList.contains("selected"));
        focusedIndex = focusedIndex < 0 ? 0 : focusedIndex;
        options[focusedIndex].focus();
      } else {
        focusedIndex = -1;
        selectButton.focus();
      }
    };

    const updateFocus = () => {
      options.forEach((opt, i) => {
        opt.setAttribute("tabindex", i === focusedIndex ? "0" : "-1");
        if (i === focusedIndex) opt.focus();
      });
    };

    const handleOptionSelect = opt => {
      const v = opt.dataset.value;
      options.forEach(o => o.classList.remove("selected"));
      if (v === "clear") {
        regionWUCOLS = "";
        localStorage.removeItem("regionWUCOLS");
        selectedValue.textContent = "FIRST: Select WUCOLS Region";
        return;
      }
      regionWUCOLS = v;
      localStorage.setItem("regionWUCOLS", v);
      opt.classList.add("selected");
      selectedValue.textContent = opt.textContent.trim();
    };

    // ——— All listeners go inside this block ———
    selectButton.addEventListener("click",  () => toggleDropdown());
    selectButton.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); toggleDropdown(true);  }
      if (e.key === "Escape")    { e.preventDefault(); toggleDropdown(false); }
    });

    dropdown.addEventListener("keydown", e => {
      if      (e.key === "ArrowDown") { e.preventDefault(); focusedIndex = (focusedIndex+1)%options.length; updateFocus(); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); focusedIndex = (focusedIndex-1+options.length)%options.length; updateFocus(); }
      else if (["Enter"," "].includes(e.key)) { e.preventDefault(); handleOptionSelect(options[focusedIndex]); toggleDropdown(false); }
      else if (e.key === "Escape")    { e.preventDefault(); toggleDropdown(false); }
    });

    document.addEventListener("click", e => {
      if (!wrapper.contains(e.target)) toggleDropdown(false);
    });

    options.forEach(opt =>
      opt.addEventListener("click", () => {
        handleOptionSelect(opt);
        toggleDropdown(false);
      })
    );
    // ————————————————————————————
  }); // ← correctly closes wrappers.forEach
}   // ← correctly closes setupRegionDropdowns
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
            const url = new URL("ucscCT120/stewardWUCOLS/plant.html", window.location.origin);
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
        if(lightCare) lightCare += ", ";
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
    
    <p>Species: ${guide.botanical_name}</p>
    <h2>${inst.nickname || inst.instance_id}</h2>
    <p>Light Needs: ${lightCare}</p>
    <p>Water Needs: ${waterUse}</p>
    <p>Notes: ${guide.notes || "no notes"}</p>
    `}
