// Guardar la configuración
function saveOptions(e) {
    e.preventDefault();
    chrome.storage.sync.set({
        pageCount: document.getElementById('page-count').value,
        showLabelPage: document.getElementById('show-label-page').checked,
        showLabelPost: document.getElementById('show-label-post').checked
    }, function() {
        alert('La configuración ha sido guardada.\n\nPara que los cambios tengan efecto, actualice la página actual o abra una nueva pestaña.');
        console.log('Configuración guardada.');
    });
}

// Cargar la configuración guardada
function restoreOptions() {
    chrome.storage.sync.get({
        pageCount: '5', // Valor predeterminado
        showLabelPage: true, // Valor predeterminado
        showLabelPost: true, // Valor predeterminado
    }, function(items) {
        document.getElementById('page-count').value = items.pageCount;
        document.getElementById('show-label-page').checked = items.showLabelPage;
        document.getElementById('show-label-post').checked = items.showLabelPost;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);