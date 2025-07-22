// K-Means Image Color Quantization
// Implementation of K-means clustering for reducing image colors

class KMeans {
    constructor(k, maxIterations = 100, tolerance = 1e-4) {
        this.k = k;
        this.maxIterations = maxIterations;
        this.tolerance = tolerance;
        this.centroids = [];
        this.clusters = [];
    }

    // Initialize centroids using k-means++ method for better initial placement
    initializeCentroids(data) {
        this.centroids = [];
        
        // Choose first centroid randomly
        const firstIndex = Math.floor(Math.random() * data.length);
        this.centroids.push([...data[firstIndex]]);
        
        // Choose remaining centroids using k-means++ method
        for (let i = 1; i < this.k; i++) {
            const distances = data.map(point => {
                // Find minimum distance to any existing centroid
                let minDist = Infinity;
                this.centroids.forEach(centroid => {
                    const dist = this.euclideanDistance(point, centroid);
                    if (dist < minDist) minDist = dist;
                });
                return minDist * minDist; // Square the distance for probability weighting
            });
            
            // Choose next centroid with probability proportional to squared distance
            const totalDist = distances.reduce((sum, d) => sum + d, 0);
            let random = Math.random() * totalDist;
            
            for (let j = 0; j < distances.length; j++) {
                random -= distances[j];
                if (random <= 0) {
                    this.centroids.push([...data[j]]);
                    break;
                }
            }
        }
    }

    // Calculate Euclidean distance between two points
    euclideanDistance(point1, point2) {
        return Math.sqrt(
            point1.reduce((sum, val, idx) => 
                sum + Math.pow(val - point2[idx], 2), 0
            )
        );
    }

    // Assign each point to the nearest centroid
    assignPointsToClusters(data) {
        this.clusters = Array(this.k).fill().map(() => []);
        
        data.forEach((point, pointIndex) => {
            let minDistance = Infinity;
            let closestCentroid = 0;
            
            this.centroids.forEach((centroid, centroidIndex) => {
                const distance = this.euclideanDistance(point, centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCentroid = centroidIndex;
                }
            });
            
            this.clusters[closestCentroid].push({ point, index: pointIndex });
        });
    }

    // Update centroids based on assigned points
    updateCentroids() {
        const newCentroids = [];
        
        this.clusters.forEach((cluster, clusterIndex) => {
            if (cluster.length === 0) {
                // Keep the old centroid if no points assigned
                newCentroids.push([...this.centroids[clusterIndex]]);
            } else {
                // Calculate mean of all points in cluster
                const dimensions = cluster[0].point.length;
                const newCentroid = Array(dimensions).fill(0);
                
                cluster.forEach(({ point }) => {
                    point.forEach((val, dim) => {
                        newCentroid[dim] += val;
                    });
                });
                
                newCentroid.forEach((sum, dim) => {
                    newCentroid[dim] = sum / cluster.length;
                });
                
                newCentroids.push(newCentroid);
            }
        });
        
        return newCentroids;
    }

    // Check if centroids have converged
    hasConverged(oldCentroids, newCentroids) {
        return oldCentroids.every((oldCentroid, index) => {
            const distance = this.euclideanDistance(oldCentroid, newCentroids[index]);
            return distance < this.tolerance;
        });
    }

    // Main clustering algorithm
    fit(data) {
        this.initializeCentroids(data);
        
        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            const oldCentroids = this.centroids.map(c => [...c]);
            
            this.assignPointsToClusters(data);
            const newCentroids = this.updateCentroids();
            
            if (this.hasConverged(oldCentroids, newCentroids)) {
                console.log(`Converged after ${iteration + 1} iterations`);
                break;
            }
            
            this.centroids = newCentroids;
        }
        
        return {
            centroids: this.centroids,
            clusters: this.clusters
        };
    }
}

// Main application class
class ImageQuantizer {
    constructor() {
        this.originalImage = null;
        this.selectedK = 4;
        this.isProcessing = false;
        this.kmeansResult = null;
        this.originalPixels = null;
        
        // 3D visualization properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentPoints = [];
        this.centroidMeshes = [];
        this.connectionLines = [];
        this.rgbCube = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSampleImages();
        this.init3DScene();
    }

    initializeElements() {
        this.imageUpload = document.getElementById('imageUpload');
        this.fileInfo = document.getElementById('fileInfo');
        this.processBtn = document.getElementById('processBtn');
        this.originalContainer = document.getElementById('originalContainer');
        this.quantizedContainer = document.getElementById('quantizedContainer');
        this.originalInfo = document.getElementById('originalInfo');
        this.quantizedInfo = document.getElementById('quantizedInfo');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.processingText = document.getElementById('processingText');
        this.colorPalette = document.getElementById('colorPalette');
        this.visualizationSection = document.getElementById('visualizationSection');
        this.canvasContainer = document.getElementById('canvas-container');
    }

    init3DScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.set(3, 3, 3);
        this.camera.lookAt(1, 1, 1);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(600, 600); // Will be resized dynamically
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Create RGB cube and axes
        this.createRGBCube();
        this.createCoordinateAxes();
        
        // Start render loop
        this.animate();
    }

    createRGBCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.3 
        });
        this.rgbCube = new THREE.LineSegments(edges, material);
        this.rgbCube.position.set(1, 1, 1);
        this.scene.add(this.rgbCube);
    }

    createCoordinateAxes() {
        // X-axis (Red)
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(2.5, 0, 0)
        ]);
        const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        this.scene.add(xAxis);
        
        // Y-axis (Green)
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 2.5, 0)
        ]);
        const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        this.scene.add(yAxis);
        
        // Z-axis (Blue)
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 2.5)
        ]);
        const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        this.scene.add(zAxis);
        
        // Add arrow heads
        this.addAxisArrows();
    }

    addAxisArrows() {
        // X-axis arrow (Red)
        const xArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
        const xArrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const xArrow = new THREE.Mesh(xArrowGeometry, xArrowMaterial);
        xArrow.position.set(2.5, 0, 0);
        xArrow.rotateZ(-Math.PI / 2);
        this.scene.add(xArrow);
        
        // Y-axis arrow (Green)
        const yArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
        const yArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const yArrow = new THREE.Mesh(yArrowGeometry, yArrowMaterial);
        yArrow.position.set(0, 2.5, 0);
        this.scene.add(yArrow);
        
        // Z-axis arrow (Blue)
        const zArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
        const zArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const zArrow = new THREE.Mesh(zArrowGeometry, zArrowMaterial);
        zArrow.position.set(0, 0, 2.5);
        zArrow.rotateX(Math.PI / 2);
        this.scene.add(zArrow);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    resizeVisualization() {
        if (!this.renderer || !this.canvasContainer) return;
        
        const rect = this.canvasContainer.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    setupEventListeners() {
        // File upload
        this.imageUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Cluster selection
        document.querySelectorAll('.cluster-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectClusterCount(e));
        });
        
        // Process button
        this.processBtn.addEventListener('click', () => this.processImage());
        
        // Sample images
        document.querySelectorAll('.sample-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadSampleImage(e.target.dataset.sample));
        });
        
        // 3D visualization controls
        document.getElementById('pointSize').addEventListener('input', () => this.update3DVisualization());
        document.getElementById('showPoints').addEventListener('change', () => this.update3DVisualization());
        document.getElementById('showConnections').addEventListener('change', () => this.update3DVisualization());
        document.getElementById('showCentroids').addEventListener('change', () => this.update3DVisualization());
        document.getElementById('showCube').addEventListener('change', (e) => {
            if (this.rgbCube) this.rgbCube.visible = e.target.checked;
        });
        
        // Window resize for 3D visualization
        window.addEventListener('resize', () => this.resizeVisualization());
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Update file info
        this.fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        
        // Clear sample button states
        document.querySelectorAll('.sample-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImageFromDataURL(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    loadImageFromDataURL(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.displayOriginalImage(img);
            this.processBtn.disabled = false;
            
            // Clear previous quantized image
            this.quantizedContainer.innerHTML = '<div class="image-placeholder">Click "Process Image" to generate quantized version</div>';
            this.quantizedInfo.innerHTML = '';
            this.colorPalette.style.display = 'none';
        };
        img.src = dataURL;
    }

    displayOriginalImage(img) {
        this.originalContainer.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.alt = 'Original Image';
        this.originalContainer.appendChild(imgElement);
        
        this.originalInfo.innerHTML = `
            <strong>Dimensions:</strong> ${img.width} × ${img.height} pixels<br>
            <strong>Total Pixels:</strong> ${(img.width * img.height).toLocaleString()}
        `;
    }

    selectClusterCount(event) {
        document.querySelectorAll('.cluster-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.selectedK = parseInt(event.target.dataset.k);
    }

    async processImage() {
        if (!this.originalImage || this.isProcessing) return;
        
        this.isProcessing = true;
        this.processBtn.disabled = true;
        this.showProgress(true);
        
        try {
            // Extract pixels from image
            this.updateProgress(10, 'Extracting pixel data...');
            const pixels = await this.extractPixels(this.originalImage);
            this.originalPixels = pixels; // Store for 3D visualization
            
            // Perform K-means clustering
            this.updateProgress(30, `Running K-means with ${this.selectedK} clusters...`);
            const kmeans = new KMeans(this.selectedK);
            this.kmeansResult = await this.runKMeansAsync(kmeans, pixels);
            
            // Create quantized image
            this.updateProgress(80, 'Creating quantized image...');
            const quantizedImage = await this.createQuantizedImage(this.originalImage, this.kmeansResult);
            
            // Display results
            this.updateProgress(90, 'Displaying results...');
            this.displayQuantizedImage(quantizedImage, this.kmeansResult.centroids);
            
            // Show and update 3D visualization
            this.updateProgress(95, 'Creating 3D visualization...');
            this.show3DVisualization();
            this.update3DVisualization();
            
            this.updateProgress(100, 'Complete!');
            setTimeout(() => this.showProgress(false), 1000);
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.processingText.textContent = 'Error processing image';
            setTimeout(() => this.showProgress(false), 2000);
        } finally {
            this.isProcessing = false;
            this.processBtn.disabled = false;
        }
    }

    extractPixels(img) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Resize large images for better performance
            let { width, height } = img;
            const maxSize = 300;
            
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = [];
            
            // Extract RGB values
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                pixels.push([r, g, b]);
            }
            
            resolve(pixels);
        });
    }

    runKMeansAsync(kmeans, pixels) {
        return new Promise((resolve) => {
            // Use setTimeout to prevent blocking the UI
            setTimeout(() => {
                const result = kmeans.fit(pixels);
                resolve(result);
            }, 50);
        });
    }

    createQuantizedImage(originalImg, kmeansResult) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Use the same dimensions as processed
            let { width, height } = originalImg;
            const maxSize = 300;
            
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const imageData = ctx.createImageData(width, height);
            const centroids = kmeansResult.centroids;
            
            // Create assignment map
            const assignments = new Array(width * height);
            kmeansResult.clusters.forEach((cluster, clusterIndex) => {
                cluster.forEach(({ index }) => {
                    assignments[index] = clusterIndex;
                });
            });
            
            // Apply centroid colors
            for (let i = 0; i < assignments.length; i++) {
                const clusterIndex = assignments[i];
                const centroid = centroids[clusterIndex];
                const pixelIndex = i * 4;
                
                imageData.data[pixelIndex] = Math.round(centroid[0]);     // R
                imageData.data[pixelIndex + 1] = Math.round(centroid[1]); // G
                imageData.data[pixelIndex + 2] = Math.round(centroid[2]); // B
                imageData.data[pixelIndex + 3] = 255;                     // A
            }
            
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        });
    }

    show3DVisualization() {
        this.visualizationSection.style.display = 'block';
        
        // Add renderer to container if not already added
        if (!this.canvasContainer.contains(this.renderer.domElement)) {
            this.canvasContainer.appendChild(this.renderer.domElement);
        }
        
        // Resize to fit container
        setTimeout(() => this.resizeVisualization(), 100);
    }

    update3DVisualization() {
        if (!this.kmeansResult || !this.originalPixels) return;
        
        // Clear existing visualization
        this.clearPoints();
        this.clearCentroids();
        this.clearConnections();
        
        const pointSize = parseFloat(document.getElementById('pointSize').value) * 0.01;
        const showPoints = document.getElementById('showPoints').checked;
        const showConnections = document.getElementById('showConnections').checked;
        const showCentroids = document.getElementById('showCentroids').checked;
        
        // Create points for each pixel, colored by original color
        if (showPoints) {
            const sampleRate = Math.max(1, Math.floor(this.originalPixels.length / 2000)); // Limit to ~2000 points for performance
            
            for (let i = 0; i < this.originalPixels.length; i += sampleRate) {
                const pixel = this.originalPixels[i];
                const [r, g, b] = pixel.map(val => val / 255); // Normalize to 0-1
                
                // Find which cluster this pixel belongs to
                let clusterIndex = 0;
                let minDistance = Infinity;
                
                this.kmeansResult.centroids.forEach((centroid, index) => {
                    const distance = Math.sqrt(
                        Math.pow(pixel[0] - centroid[0], 2) +
                        Math.pow(pixel[1] - centroid[1], 2) +
                        Math.pow(pixel[2] - centroid[2], 2)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        clusterIndex = index;
                    }
                });
                
                // Create point
                const geometry = new THREE.SphereGeometry(pointSize, 8, 8);
                const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Position in RGB space (0-2 range for Three.js)
                mesh.position.set(r * 2, g * 2, b * 2);
                mesh.userData = { clusterIndex, originalColor: [r, g, b] };
                
                this.scene.add(mesh);
                this.currentPoints.push(mesh);
                
                // Create connection line to centroid if enabled
                if (showConnections) {
                    const centroid = this.kmeansResult.centroids[clusterIndex];
                    const [cr, cg, cb] = centroid.map(val => val / 255);
                    
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(r * 2, g * 2, b * 2),
                        new THREE.Vector3(cr * 2, cg * 2, cb * 2)
                    ]);
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: 0x666666, 
                        transparent: true, 
                        opacity: 0.3 
                    });
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    
                    this.scene.add(line);
                    this.connectionLines.push(line);
                }
            }
        }
        
        // Create centroid visualizations if enabled
        if (showCentroids) {
            this.kmeansResult.centroids.forEach((centroid, index) => {
                const [r, g, b] = centroid.map(val => val / 255);
                
                // Large sphere for centroid
                const geometry = new THREE.SphereGeometry(pointSize * 3, 16, 16);
                const material = new THREE.MeshLambertMaterial({ 
                    color: new THREE.Color(r, g, b),
                    emissive: new THREE.Color(r * 0.2, g * 0.2, b * 0.2)
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(r * 2, g * 2, b * 2);
                
                this.scene.add(mesh);
                this.centroidMeshes.push(mesh);
            });
        }
    }

    clearPoints() {
        this.currentPoints.forEach(point => {
            this.scene.remove(point);
            point.geometry.dispose();
            point.material.dispose();
        });
        this.currentPoints = [];
    }

    clearCentroids() {
        this.centroidMeshes.forEach(centroid => {
            this.scene.remove(centroid);
            centroid.geometry.dispose();
            centroid.material.dispose();
        });
        this.centroidMeshes = [];
    }

    clearConnections() {
        this.connectionLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.connectionLines = [];
    }

    displayQuantizedImage(imageDataURL, centroids) {
        this.quantizedContainer.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.src = imageDataURL;
        imgElement.alt = 'Quantized Image';
        this.quantizedContainer.appendChild(imgElement);
        
        // Display color palette
        this.displayColorPalette(centroids);
        
        this.quantizedInfo.innerHTML = `
            <strong>Clusters:</strong> ${this.selectedK}<br>
            <strong>Colors Used:</strong> ${centroids.length}<br>
            <strong>Algorithm:</strong> K-means clustering
        `;
    }

    displayColorPalette(centroids) {
        this.colorPalette.innerHTML = '';
        this.colorPalette.style.display = 'flex';
        
        centroids.forEach((centroid, index) => {
            const [r, g, b] = centroid.map(val => Math.round(val));
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            swatch.title = `Cluster ${index + 1}: RGB(${r}, ${g}, ${b})`;
            swatch.textContent = index + 1;
            this.colorPalette.appendChild(swatch);
        });
    }

    showProgress(show) {
        this.progressBar.style.display = show ? 'block' : 'none';
        this.processingText.style.display = show ? 'block' : 'none';
        if (!show) {
            this.progressFill.style.width = '0%';
        }
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.processingText.textContent = text;
    }

    loadSampleImages() {
        // Create sample images programmatically
        const samples = {
            nature: this.createNatureSample(),
            portrait: this.createPortraitSample(),
            colorful: this.createColorfulSample(),
            gradient: this.createGradientSample()
        };
        
        this.sampleImages = samples;
    }

    createNatureSample() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Create a simple nature-like scene with sky, trees, and grass
        // Sky (blue gradient)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, 75);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#98D8E8');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, 200, 75);
        
        // Trees (green areas)
        ctx.fillStyle = '#228B22';
        ctx.fillRect(20, 50, 30, 60);
        ctx.fillRect(60, 45, 25, 65);
        ctx.fillRect(120, 55, 35, 55);
        ctx.fillRect(170, 40, 20, 70);
        
        // Tree trunks (brown)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(32, 90, 6, 20);
        ctx.fillRect(70, 90, 5, 20);
        ctx.fillRect(135, 90, 5, 20);
        ctx.fillRect(178, 90, 4, 20);
        
        // Grass (green gradient)
        const grassGradient = ctx.createLinearGradient(0, 110, 0, 150);
        grassGradient.addColorStop(0, '#32CD32');
        grassGradient.addColorStop(1, '#228B22');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, 110, 200, 40);
        
        return canvas.toDataURL();
    }

    createPortraitSample() {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(0, 0, 150, 200);
        
        // Face (skin tone)
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.ellipse(75, 80, 35, 45, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Hair
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(75, 60, 40, 35, 0, 0, Math.PI);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(65, 75, 3, 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(85, 75, 3, 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Shirt
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(40, 140, 70, 60);
        
        return canvas.toDataURL();
    }

    createColorfulSample() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Create colorful geometric shapes
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
        
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = colors[i];
            const x = (i % 4) * 50;
            const y = Math.floor(i / 4) * 100;
            
            if (i % 2 === 0) {
                ctx.fillRect(x, y, 50, 100);
            } else {
                ctx.beginPath();
                ctx.arc(x + 25, y + 50, 25, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        return canvas.toDataURL();
    }

    createGradientSample() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Create a rainbow gradient
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.17, '#FF8800');
        gradient.addColorStop(0.33, '#FFFF00');
        gradient.addColorStop(0.5, '#00FF00');
        gradient.addColorStop(0.67, '#0088FF');
        gradient.addColorStop(0.83, '#0000FF');
        gradient.addColorStop(1, '#8800FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);
        
        return canvas.toDataURL();
    }

    loadSampleImage(sampleKey) {
        if (!this.sampleImages[sampleKey]) return;
        
        // Update button states
        document.querySelectorAll('.sample-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-sample="${sampleKey}"]`).classList.add('active');
        
        // Clear file input
        this.imageUpload.value = '';
        this.fileInfo.textContent = `Sample: ${sampleKey.charAt(0).toUpperCase() + sampleKey.slice(1)}`;
        
        this.loadImageFromDataURL(this.sampleImages[sampleKey]);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageQuantizer();
});
