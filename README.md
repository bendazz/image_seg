# K-Means Image Color Quantization

An interactive web application that performs image color quantization using K-means clustering. Upload any image and reduce its color palette to 2-9 colors, with each pixel replaced by its cluster centroid's RGB values.

![K-Means Color Quantization Demo](demo-preview.png)

## Features

- **Interactive Image Upload**: Support for JPG, PNG, GIF, and WebP formats
- **K-means Clustering**: Choose between 2-9 clusters for color reduction
- **Real-time Processing**: See immediate results with progress indication
- **Color Palette Visualization**: View the exact RGB colors used in quantization
- **Sample Images**: Built-in examples to test different image types
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Automatic image resizing for smooth processing

## How It Works

1. **Image Processing**: The uploaded image is processed to extract RGB pixel data
2. **K-means Clustering**: The algorithm groups similar colors into K clusters
3. **Centroid Calculation**: Each cluster's centroid represents the average color
4. **Color Replacement**: All pixels are replaced with their nearest centroid color
5. **Result Display**: The quantized image is shown alongside the color palette

## K-means Algorithm Implementation

The project includes a custom K-means implementation with:

- **K-means++** initialization for better centroid placement
- **Euclidean distance** calculation in RGB color space
- **Convergence detection** to optimize performance
- **Asynchronous processing** to prevent UI blocking

## Usage

1. **Upload Image**: Click "Choose Image File" or select a sample image
2. **Select Clusters**: Choose the number of colors (2-9) using the buttons
3. **Process**: Click "Process Image" to run K-means clustering
4. **Compare**: View the original vs quantized image side-by-side
5. **Explore**: Try different cluster numbers to see the effect

## Sample Images

The app includes four built-in samples:

- **Nature**: Landscape with sky, trees, and grass (good for testing natural color clustering)
- **Portrait**: Simple portrait with skin tones (demonstrates human color palette reduction)
- **Colorful**: Geometric shapes with primary colors (shows distinct color separation)
- **Gradient**: Rainbow gradient (illustrates smooth color transitions)

## Technical Details

### Technologies Used
- **HTML5 Canvas** for image processing and rendering
- **Vanilla JavaScript** for K-means implementation
- **CSS3** with flexbox and grid for responsive layout
- **File API** for image upload handling

### Performance Optimizations
- Images automatically resized to max 300px for faster processing
- Asynchronous processing prevents UI freezing
- Progress indicators for user feedback
- Efficient memory management for large images

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Mathematical Background

The K-means algorithm minimizes the within-cluster sum of squares:

```
J = Σ(i=1 to k) Σ(x∈Ci) ||x - μi||²
```

Where:
- `k` is the number of clusters
- `Ci` is the i-th cluster  
- `μi` is the centroid of cluster i
- `x` is a data point (RGB pixel)

## Applications

Color quantization has many practical uses:

- **Image Compression**: Reducing color depth for smaller file sizes
- **Artistic Effects**: Creating poster-like or cartoon-style images
- **Print Optimization**: Limiting colors for screen printing or printing costs
- **Data Analysis**: Understanding dominant colors in images
- **Accessibility**: Simplifying images for certain visual conditions

## Getting Started

1. Clone or download this repository
2. Open `index.html` in a web browser
3. No installation or build process required!

## Project Structure

```
image_seg/
├── index.html          # Main HTML file with UI structure
├── script.js          # K-means implementation and app logic
└── README.md          # This documentation file
```

## Customization

The application can be easily extended:

- **Add more sample images** by modifying the `loadSampleImages()` method
- **Adjust cluster range** by changing the cluster buttons in HTML
- **Modify color distance** by updating the `euclideanDistance()` method
- **Add different color spaces** (HSV, LAB) for clustering
- **Implement other algorithms** like median cut or octree quantization

## Educational Value

This project demonstrates:

- **Machine Learning Concepts**: Unsupervised clustering algorithms
- **Color Theory**: How digital images represent color in RGB space
- **JavaScript Programming**: Canvas API, async/await, ES6 classes
- **User Interface Design**: Progressive web app patterns
- **Image Processing**: Pixel manipulation and color space operations

## Contributing

Feel free to contribute improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

---

**Try it now!** Upload your favorite image and see how different numbers of clusters affect the visual result. Experiment with portraits, landscapes, and abstract images to understand how K-means clustering works in practice.