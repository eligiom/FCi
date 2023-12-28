function getThreadId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('t');
}

function getCurrentPageNumber() {
    const url = window.location.href;
    const pageParam = url.match(/&page=(\d+)/);

    return pageParam ? parseInt(pageParam[1], 10) : 1; // Si no hay parámetro de página, asumir que es la página 1
}

function getBaseUrl() {
    const url = window.location.href;
    const pageParamIndex = url.indexOf('&page=');

    // Si '&page=' está presente en la URL, cortarla para obtener la URL base
    if (pageParamIndex !== -1) {
        return url.substring(0, pageParamIndex);
    }

    return url;
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const imgs = Array.from(doc.querySelectorAll('.imgpost')).map(img => {
                    const postTable = img.closest('table[width="100%"]');
                    const postId = postTable.id.replace('post', ''); // Obtiene el ID del post
                    const postNumber = doc.querySelector(`a[href*="#post${postId}"][id^="postcount"]`).textContent; // Obtiene el número del post
                    return { src: img.src, postNumber: postNumber, postId: postId };
                });
                console.log(`Fetched ${imgs.length} images from ${url}`);
                resolve(imgs);
            })
            .catch(error => reject(error));
    });
}

function getAllImages(pageCount, showLabelPage, showLabelPost) {
    const currentPage = getCurrentPageNumber();
    console.log(`Current page: ${currentPage}`);    
    const baseUrl = getBaseUrl();
    const pages = [];
    let totalImagesFetched = 0;
    let seenImages = new Set();
    let totalPageCount = parseInt(pageCount, 10);

    for (let i = 0; i < totalPageCount; i++) {
        pages.push(`${baseUrl}&page=${currentPage + i}`);
    }

    // Cargar imágenes de cada página en orden
    pages.reduce(async (promiseChain, pageUrl) => {
        await promiseChain;
        const images = await fetchPage(pageUrl);
        const newImages = images.filter(image => {
            if (!seenImages.has(image.src)) { // Comprobar si la URL de la imagen ya está en el conjunto
                seenImages.add(image.src); // Añadir solo la URL de la imagen al conjunto
                return true;
            }
            return false;
        });

        totalImagesFetched += newImages.length;
        insertImagesIntoRow(newImages, currentPage + pages.indexOf(pageUrl), showLabelPage, showLabelPost);
    }, Promise.resolve()).then(() => {
        if (totalImagesFetched === 0) {
            displayNoImagesMessage();
        }
    });
}

function insertImagesIntoRow(images, pageNumber, showLabelPage, showLabelPost) {
    const threadId = getThreadId();
    console.log(`Thread ID: ${threadId}`);
    console.log(showLabelPage ? `Showing labels for page ${pageNumber}` : `Not showing labels for page ${pageNumber}`);
    console.log(showLabelPost ? `Showing labels for post ${pageNumber}` : `Not showing labels for page ${pageNumber}`);

    let newDiv = document.querySelector('.row'); // Intentar encontrar el contenedor existente

    // Crear un nuevo contenedor solo si no existe
    if (!newDiv) {
        const walker = document.createTreeWalker(
            document.body, 
            NodeFilter.SHOW_COMMENT, 
            null, 
            false
        );

        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode.nodeValue.trim() === '/ controls above postbits') {
                newDiv = document.createElement('div');
                newDiv.className = 'row';
                newDiv.style.backgroundColor = '#f1f1f1';         
                newDiv.style.border = '1px solid #d1d1d1';       
                currentNode.parentNode.replaceChild(newDiv, currentNode);
                break;
            }
        }
    }

    // Insertar las imágenes como thumbnails
    images.forEach(({ src, postNumber, postId }) => {
        // Crear el enlace
        const postLink = document.createElement('a');
        postLink.href = `https://forocoches.com/foro/showthread.php?t=${threadId}&page=${pageNumber}#post${postId}`;
        postLink.target = '_self';

        // Contenedor para cada imagen y su etiqueta
        const container = document.createElement('div');
        container.style.display = 'inline-flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.margin = '5px';
        container.style.width = '100px'; // Ancho fijo
        container.style.height = '75px'; // Alto fijo
    
        // Crear y configurar la imagen
        const img = document.createElement('img');
        img.src = src;
        img.className = 'thumbnail';
        img.style.width = '100%'; // Asegura que la imagen llene el ancho del contenedor
        img.style.height = '100%'; // Asegura que la imagen llene el alto del contenedor
        img.style.objectFit = 'contain'; // Mantiene la relación de aspecto de la imagen sin recortarla

        img.onerror = () => {
            container.style.display = 'none'; // Ocultar el contenedor si hay un error en la imagen
        };
    
        // Agregar la imagen y la etiqueta al contenedor
        container.appendChild(img);

        // Crear y configurar la etiqueta
        if (showLabelPage || showLabelPost) {
            const label = document.createElement('span');
            label.className = 'thead';
            label.style.backgroundColor = '#f1f1f1';
            label.style.fontWeight = 'normal';
            
            var content = '';

            if (showLabelPage) content += `Pág. ${pageNumber}`;
            if (showLabelPage && showLabelPost) content += ' - ';
            if (showLabelPost) content += `#${postNumber}`;

            label.textContent = content;

            container.appendChild(label);
        }        

        // Agregar el contenedor al enlace
        postLink.appendChild(container);

        // Agregar el enlace al div 'row'
        newDiv.appendChild(postLink);
    });
}

function displayNoImagesMessage() {
    let newDiv = document.querySelector('.row'); // Intentar encontrar el contenedor existente

    // Crear un nuevo contenedor solo si no existe
    if (!newDiv) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode.nodeValue.trim() === '/ controls above postbits') {
                newDiv = document.createElement('div');
                newDiv.className = 'row';
                newDiv.style.backgroundColor = '#f1f1f1';
                currentNode.parentNode.replaceChild(newDiv, currentNode);
                break;
            }
        }
    }

    // Agregar mensaje de "No hay imágenes"
    const noImagesMsg = document.createElement('p');
    noImagesMsg.textContent = 'FCi: No hay imágenes en este hilo';
    noImagesMsg.style.color = '#ca3415';
    noImagesMsg.style.fontWeight = 'bolder';
    noImagesMsg.style.padding = '15px';    
    
    newDiv.appendChild(noImagesMsg);
}

function loadImagesWithConfig() {
    chrome.runtime.sendMessage({ action: "getConfig" }, function(response) {
        getAllImages(response.pageCount, response.showLabelPage, response.showLabelPost);
    });
}

// Ejecutar cuando la página esté completamente cargada
window.onload = loadImagesWithConfig;