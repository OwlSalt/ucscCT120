let inventory = [];
let careGuides = [];
let regionWUCOLS = "";

// DOMContentLoaded = loads JSON files and initializes UI
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 
        // UI init
        setupRegionDropdowns();
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