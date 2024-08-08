// This script assumes the presence of `hamkey.js` which includes the logic you provided.
document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab");
    const output = document.getElementById("output");
    let selectedGame = "BIKE";

    // Handle tab switching
    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            selectedGame = tab.getAttribute("data-game");
            output.textContent = `Ready to generate codes for ${selectedGame}.`;
        });
    });

    // Handle Generate Code button click
    document.getElementById
