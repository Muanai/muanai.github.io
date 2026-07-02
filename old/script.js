// script.js

function openTab(projectId, tabName) {
    const projectContainer = document.getElementById(`project-${projectId}`);
    
    // 1. Hide all content
    const contents = projectContainer.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('block');
    });

    // 2. Reset buttons
    const buttons = projectContainer.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('text-white', 'border-accent', 'bg-white/5');
        btn.classList.add('text-gray-500', 'border-transparent');
    });

    // 3. Show selected content
    const selectedContent = document.getElementById(`${projectId}-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('block');
    }

    // 4. Activate button
    const activeButton = Array.from(buttons).find(b => b.getAttribute('data-target') === tabName);
    if (activeButton) {
        activeButton.classList.remove('text-gray-500', 'border-transparent');
        activeButton.classList.add('text-white', 'border-accent', 'bg-white/5');
    }
}