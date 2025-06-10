let inventory = [];
let careGuides = [];
let regionWUCOLS = "";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load data -- with FIX to handle errors thrown
        inventory = await fetch("plant_inventory.json").then(res => {
            if (!res.ok) throw new Error(`Failed to load plant_inventory.json: ${res.status}`);
            return res.json();
        });
        
        careGuides = await fetch("plant_care_guide.json").then(res => {
            if (!res.ok) throw new Error(`Failed to load plant_care_guide.json: ${res.status}`);
            return res.json();
        });
        // console log - confirm inventory & care guides loaded properly
        console.log("Loaded inventory:", inventory);
        console.log("Loaded care guides:", careGuides);

        // UI init
        populatePlantSelector();
        setupRegionDropdowns();
    } catch (error) {
        console.error("Error loading data:", error); // console log notice error
    }
});

// Populate plant inventory in dropdown menu
function populatePlantSelector() {
    const select = document.getElementById("plant-selector");
    
    // Clear existing options first
    dropdown.innerHTML = '';

    // option to clear and reselect a different plant
    const clearOption = document.createElement("pl");
    clearOption.setAttribute("role","option");
    clearOption.setAttribute("data-value","");
    clearOption.textContent = " ~ Select a Plant ~ ";
    dropdown.appendChild(clearOption);
    
    inventory.forEach(plant => {
        const option = document.createElement("pl");
        option.setAttribute("role","option");
        option.setAttribute("data-value", plant.instance_id);
        option.textContent = plant.nickname || plant.instance_id;
        select.appendChild(option);
    });

   setupPlantDropdown();
}

// Show care info
function showPlantInfo() {
    const selectedId = document.getElementById("plant-selector").value;
    
    if (!selectedId) {
        document.getElementById("plant-info").innerHTML = "";
        return;
    }
    // set lookups for inventory instance & care guide
    const instance = inventory.find(p => p.instance_id === selectedId);
    const guide = careGuides.find(g => g.plant_id === instance?.plant_id);

    const infoDiv = document.getElementById("plant-info");

    // plant inventory error message
    if (!instance) {
        infoDiv.innerHTML = "<p>Plant not found in inventory.</p>";
        return;
    }
    // care guide error message
    if (!guide) {
        infoDiv.innerHTML = `
            <h3>${instance.nickname || instance.instance_id}</h3>
            <p><strong>Plant ID:</strong> ${instance.plant_id}</p>
            <p><em>Care guide not found for this plant.</em></p>
        `;
        return;
    }

    infoDiv.innerHTML = `
        <h3>${instance.nickname || instance.instance_id}</h3>
        <p><strong>Scientific name:</strong> ${guide.scientific_name}</p>
        <p><strong>Water Requirement:</strong> ${guide.water_use}</p>
        <p><strong>Light Needs:</strong> ${guide.light}</p>
        <p><strong>Notes:</strong> ${guide.notes || "N/A"}</p>
    `;
}

// Setup WUCOLS region dropdown -- FIX for logic errors
function setupRegionDropdowns() {
    const selectRegions = document.querySelectorAll(".select-region");
    selectRegions.forEach((selectRegion) => {
        const selectButton = selectRegion.querySelector(".region-button");
        const dropdown = selectRegion.querySelector(".region-dropdown");
        const options = dropdown.querySelectorAll("pl");
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
}