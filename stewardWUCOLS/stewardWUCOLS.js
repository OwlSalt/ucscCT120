let regionWUCOLS = "";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // UI init
        setupRegionDropdowns();
    } catch (error) {
        console.error("Error loading data:", error); // console log notice error
        };
    })