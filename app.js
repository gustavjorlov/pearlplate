document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const dropZone = document.getElementById('dropZone');
    const container = document.querySelector('.canvas-container');
    const colorPalette = document.getElementById('colorPalette');
    const colorPicker = document.getElementById('colorPicker');
    const addColorBtn = document.getElementById('addColorBtn');
    
    // Array to store colors
    let colors = [];
    
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
    
    // Color palette functionality
    
    // Load colors from localStorage
    function loadColors() {
        const savedColors = localStorage.getItem('colorPalette');
        if (savedColors) {
            colors = JSON.parse(savedColors);
            renderColorPalette();
        }
    }
    
    // Save colors to localStorage
    function saveColors() {
        localStorage.setItem('colorPalette', JSON.stringify(colors));
    }
    
    
    // Create a color circle element
    function createColorCircle(color, index) {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        
        const colorCircle = document.createElement('div');
        colorCircle.className = 'color-circle';
        colorCircle.style.backgroundColor = color;
        colorCircle.dataset.index = index;
        
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-color';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete color';
        
        // Add click event to edit the color
        colorCircle.addEventListener('click', (e) => {
            // Prevent click from triggering parent elements
            e.stopPropagation();
            
            // Get the position of the clicked color circle
            const rect = colorCircle.getBoundingClientRect();
            
            // Create a temporary color picker
            const tempColorPicker = document.createElement('input');
            tempColorPicker.type = 'color';
            tempColorPicker.value = color;
            tempColorPicker.style.position = 'absolute';
            tempColorPicker.style.left = `${rect.left}px`;
            tempColorPicker.style.top = `${rect.top}px`;
            tempColorPicker.style.opacity = '0';
            tempColorPicker.style.pointerEvents = 'none'; // Prevent it from blocking other elements
            
            // Add to DOM
            document.body.appendChild(tempColorPicker);
            
            // Open the color picker
            tempColorPicker.click();
            
            // Handle color change
            tempColorPicker.addEventListener('input', () => {
                colorCircle.style.backgroundColor = tempColorPicker.value;
            });
            
            tempColorPicker.addEventListener('change', () => {
                // Update the color in the array
                colors[index] = tempColorPicker.value;
                
                // Update the color circle
                colorCircle.style.backgroundColor = tempColorPicker.value;
                
                // Save to localStorage
                saveColors();
                
                // Remove the temporary color picker
                document.body.removeChild(tempColorPicker);
            });
        });
        
        // Add click event to delete the color
        deleteBtn.addEventListener('click', (e) => {
            // Prevent click from triggering parent elements
            e.stopPropagation();
            
            // Remove the color from the array
            colors.splice(index, 1);
            
            // Re-render the palette
            renderColorPalette();
            
            // Save to localStorage
            saveColors();
        });
        
        colorItem.appendChild(colorCircle);
        colorItem.appendChild(deleteBtn);
        
        return colorItem;
    }
    
    // Render all colors in the palette
    function renderColorPalette() {
        // Clear the palette
        colorPalette.innerHTML = '';
        
        // Add each color
        colors.forEach((color, index) => {
            const colorItem = createColorCircle(color, index);
            colorPalette.appendChild(colorItem);
        });
    }
    
    // Add a new color to the palette
    function addColor() {
        const newColor = colorPicker.value;
        colors.push(newColor);
        
        // Re-render the palette to include the new color
        renderColorPalette();
        
        // Save to localStorage
        saveColors();
    }
    
    // Add color button event listener
    addColorBtn.addEventListener('click', addColor);
    
    // Load saved colors on page load
    loadColors();
});
