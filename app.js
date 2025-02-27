document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const resultCanvas = document.getElementById('resultCanvas');
    const resultCtx = resultCanvas.getContext('2d');
    const dropZone = document.getElementById('dropZone');
    const container = document.querySelector('.canvas-container');
    const resultContainer = document.getElementById('resultCanvasContainer');
    const colorPalette = document.getElementById('colorPalette');
    const colorPicker = document.getElementById('colorPicker');
    const addColorBtn = document.getElementById('addColorBtn');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // Array to store colors
    let colors = [];
    
    // Current size value
    let currentSize = 50;
    
    // Track if we have an image loaded
    let imageLoaded = false;
    
    // Set canvas dimensions to match its display size
    function setupCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        resultCanvas.width = rect.width;
        resultCanvas.height = rect.height;
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        resultCtx.fillStyle = 'white';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    }
    
    setupCanvas();
    
    // Handle window resize
    // window.addEventListener('resize', setupCanvas);
    
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
                
                // Hide the drop zone and enable analyze button
                container.classList.add('image-loaded');
                analyzeBtn.disabled = false;
                imageLoaded = true;
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
    
    // Size setting functionality
    
    // Load size from localStorage
    function loadSize() {
        const savedSize = localStorage.getItem('canvasSize');
        if (savedSize !== null) {
            currentSize = parseInt(savedSize);
            sizeSlider.value = currentSize;
            sizeValue.textContent = currentSize;
        }
    }
    
    // Save size to localStorage
    function saveSize() {
        localStorage.setItem('canvasSize', currentSize.toString());
    }
    
    // Update size value display
    sizeSlider.addEventListener('input', () => {
        currentSize = parseInt(sizeSlider.value);
        sizeValue.textContent = currentSize;
    });
    
    // Save size when slider is released
    sizeSlider.addEventListener('change', () => {
        saveSize();
    });
    
    // Load saved size on page load
    loadSize();
    
    // Image analysis functionality
    
    // Calculate the average color of a region in the canvas
    function getAverageColor(startX, startY, width, height) {
        const imageData = ctx.getImageData(startX, startY, width, height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        // Sum all RGB values
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }
        
        // Calculate average
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        return { r, g, b };
    }
    
    // Convert RGB to hex color
    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    // Parse hex color to RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    // Calculate color distance (Euclidean distance in RGB space)
    function colorDistance(color1, color2) {
        return Math.sqrt(
            Math.pow(color1.r - color2.r, 2) +
            Math.pow(color1.g - color2.g, 2) +
            Math.pow(color1.b - color2.b, 2)
        );
    }
    
    // Find the closest color from the palette
    function findClosestColor(targetColor) {
        if (colors.length === 0) return '#FFFFFF'; // Default to white if no colors
        
        let closestColor = colors[0];
        let minDistance = Number.MAX_VALUE;
        
        const targetRgb = hexToRgb(rgbToHex(targetColor.r, targetColor.g, targetColor.b));
        
        colors.forEach(color => {
            const colorRgb = hexToRgb(color);
            const distance = colorDistance(targetRgb, colorRgb);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        });
        
        return closestColor;
    }
    
    // Analyze the image and create a pixelated version with palette colors
    function analyzeImage() {
        if (!imageLoaded || colors.length === 0) return;
        
        // Clear the result canvas
        resultCtx.fillStyle = 'white';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // Calculate square size based on the current size setting
        // Size setting 1-100 maps to dividing the canvas into 2-50 squares
        const gridSize = Math.max(2, Math.floor(currentSize / 2));
        const squareWidth = canvas.width / gridSize;
        const squareHeight = canvas.height / gridSize;
        
        // Process each square
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                // Calculate position
                const startX = x * squareWidth;
                const startY = y * squareHeight;
                
                // Get average color of this region
                const avgColor = getAverageColor(startX, startY, squareWidth, squareHeight);
                
                // Find closest color from palette
                const matchedColor = findClosestColor(avgColor);
                
                // Draw a circle with subtle outline instead of a rectangle
                const centerX = startX + squareWidth / 2;
                const centerY = startY + squareHeight / 2;
                const radius = Math.min(squareWidth, squareHeight) / 2;
                
                // Fill the circle
                resultCtx.fillStyle = matchedColor;
                resultCtx.beginPath();
                resultCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                resultCtx.fill();
                
                // Add subtle outline
                resultCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                resultCtx.lineWidth = 1;
                resultCtx.beginPath();
                resultCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                resultCtx.stroke();
            }
        }
        
        // Show the result canvas
        resultContainer.style.display = 'block';
    }
    
    // Analyze button event listener
    analyzeBtn.addEventListener('click', analyzeImage);
});
