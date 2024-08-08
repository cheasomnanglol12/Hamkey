document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".content");

    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove("active"));

            // Add active class to the clicked tab
            tab.classList.add("active");

            // Hide all content sections
            contents.forEach(content => content.classList.remove("active"));

            // Show the content section corresponding to the clicked tab
            const activeContent = document.getElementById(tab.dataset.tab);
            activeContent.classList.add("active");
        });
    });
});
