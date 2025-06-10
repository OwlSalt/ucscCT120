let inventory = [];
let careGuides = [];
let regionWUCOLS = "";

document.addEventListener("DOMContentLoaded", async () => {
    // load data
    inventory = await fetch("plant_inventory.json").then(res => res.json());
    careGuides = await fetch("plant_care_guide.json").then (res => res.json());

    //init UI
    populatePlantSelector();
    setupRegionDropdowns();
});

// populate plant inventory in dropdown selector
function populatePlantSelector() {
    const select = document.getElementById("plant-selector");
    inventory.forEach(plant => {
        const option = document.createElement("option");
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
  infoDiv.innerHTML = `
    <h3>${instance.nickname || instance.instance_id}</h3>
    <p><strong>Scientific name:</strong> ${guide.scientific_name}</p>
    <p><strong>Water Use:</strong> ${guide.water_use}</p>
    <p><strong>Light:</strong> ${guide.light}</p>
    <p><strong>Notes:</strong> ${guide.notes || "N/A"}</p>
`;
}

// setup WUCOLS region dropdown
function setupRegionDropdowns() {
      const selectRegions = document.querySelectorAll(".select-region");

  selectRegions.forEach((selectRegion) => {
    const selectButton = selectRegion.querySelector(".region-button");
    const dropdown = selectRegion.querySelector(".region-dropdown");
    const options = dropdown.querySelectorAll("li");
    const selectedValue = selectButton.querySelector(".selected-value");

    let focusedIndex = -1;

    const toggleDropdown = (expand = null) => {
      const isOpen =
        expand !== null ? expand : dropdown.classList.contains("hidden");
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
      options.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedValue.textContent = option.textContent.trim(); // Update selected value

      if (option.dataset.value === "clear") {
        // Reset to the default value
        selectedValue.textContent = "FIRST: Select WUCOLS Region";
        options.forEach((opt) => opt.classList.remove("selected"));
        return;
      }
      regionWUCOLS = option.dataset.value;
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