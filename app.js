document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const dropZone = document.getElementById('dropZone');
    const container = document.querySelector('.canvas-container');
    
    // Set canvas dimensions to match its display size
    function setupCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    setupCanvas();
    
    // Handle window resize
    window.addEventListener('resize', setupCanvas);
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        document.body.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        container.classList.add('drag-over');
    }
    
    function unhighlight() {
        container.classList.remove('drag-over');
    }
    
    // Handle dropped files
    document.body.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            const file = files[0];
            if (file.type.match('image.*')) {
                processImage(file);
            }
        }
    }
    
    // Process the dropped image
    function processImage(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                // Clear the canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Calculate dimensions to maintain aspect ratio
                const dimensions = calculateAspectRatioFit(
                    img.width, 
                    img.height, 
                    canvas.width, 
                    canvas.height
                );
                
                // Center the image on the canvas
                const x = (canvas.width - dimensions.width) / 2;
                const y = (canvas.height - dimensions.height) / 2;
                
                // Draw the image on the canvas
                ctx.drawImage(img, x, y, dimensions.width, dimensions.height);
                
                // Hide the drop zone
                container.classList.add('image-loaded');
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    // Calculate dimensions while maintaining aspect ratio
    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio
        };
    }
    
    // Allow clicking on canvas to trigger file upload as an alternative
    canvas.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = e => {
            if (e.target.files.length) {
                processImage(e.target.files[0]);
            }
        };
        
        input.click();
    });
});
