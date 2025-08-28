// Vite Plugin for Image Optimization
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const DEFAULT_SIZES = [320, 640, 768, 1024, 1280, 1920];
const DEFAULT_QUALITY = 80;

export function imageOptimization(options = {}) {
  const {
    sizes = DEFAULT_SIZES,
    quality = DEFAULT_QUALITY,
    formats = ['webp', 'avif'],
    includeOriginal = true,
    outputDir = 'optimized-images',
    enableInDev = false
  } = options;

  let config;
  let isDev;

  return {
    name: 'vite-plugin-image-optimization',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isDev = resolvedConfig.command === 'serve';
    },

    async buildStart() {
      if (isDev && !enableInDev) return;

      // Create output directory
      const outputPath = path.join(config.root, 'public', outputDir);
      await fs.mkdir(outputPath, { recursive: true });
    },

    async load(id) {
      if (isDev && !enableInDev) return null;

      const match = id.match(/\.(jpg|jpeg|png|webp|avif)\?optimize=(.+)$/);
      if (!match) return null;

      const [, , paramsStr] = match;
      const imagePath = id.replace(/\?optimize=.+$/, '');
      const params = new URLSearchParams(paramsStr);

      try {
        const optimizedImages = await generateOptimizedImages(
          imagePath,
          {
            sizes: params.get('sizes')?.split(',').map(Number) || sizes,
            quality: Number(params.get('quality')) || quality,
            formats: params.get('formats')?.split(',') || formats,
            includeOriginal
          }
        );

        // Return JavaScript module that exports the optimized image data
        return `
          export default ${JSON.stringify(optimizedImages)};
          export const srcSet = ${JSON.stringify(generateSrcSet(optimizedImages))};
          export const placeholder = ${JSON.stringify(await generatePlaceholder(imagePath))};
        `;

      } catch (error) {
        console.error('Image optimization failed:', error);
        return null;
      }
    }
  };
}

async function generateOptimizedImages(imagePath, options) {
  const { sizes, quality, formats, includeOriginal } = options;
  const results = {};

  // Check if original image exists
  try {
    await fs.access(imagePath);
  } catch {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const imageInfo = path.parse(imagePath);
  const outputDir = path.join(path.dirname(imagePath), 'optimized');

  await fs.mkdir(outputDir, { recursive: true });

  // Generate hash for cache busting
  const imageBuffer = await fs.readFile(imagePath);
  const hash = createHash('md5').update(imageBuffer).digest('hex').substring(0, 8);

  // Process each format
  for (const format of formats) {
    results[format] = [];

    for (const size of sizes) {
      const filename = `${imageInfo.name}-${size}w-${hash}.${format}`;
      const outputPath = path.join(outputDir, filename);

      // In a real implementation, you would use sharp or similar for image processing
      // For now, we'll simulate the optimization
      await simulateImageOptimization(imagePath, outputPath, {
        width: size,
        format,
        quality
      });

      results[format].push({
        src: outputPath.replace(process.cwd(), ''),
        width: size,
        size: await getFileSize(outputPath)
      });
    }
  }

  // Include original if requested
  if (includeOriginal) {
    results.original = [{
      src: imagePath.replace(process.cwd(), ''),
      width: null,
      size: imageBuffer.length
    }];
  }

  return results;
}

async function simulateImageOptimization(inputPath, outputPath, _options) {
  // In production, replace this with actual image processing using sharp:
  /*
  const sharp = require('sharp');

  let pipeline = sharp(inputPath);

  if (options.width) {
    pipeline = pipeline.resize(options.width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  switch (options.format) {
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality });
      break;
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: options.quality });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: options.quality });
      break;
  }

  await pipeline.toFile(outputPath);
  */

  // For now, just copy the original file
  const inputBuffer = await fs.readFile(inputPath);
  await fs.writeFile(outputPath, inputBuffer);
}

function generateSrcSet(optimizedImages) {
  const srcSets = {};

  Object.entries(optimizedImages).forEach(([format, images]) => {
    if (format === 'original') return;

    srcSets[format] = images
      .map(img => `${img.src} ${img.width}w`)
      .join(', ');
  });

  return srcSets;
}

async function generatePlaceholder(_imagePath) {
  // Generate a tiny placeholder image (could be base64 encoded)
  // For now, return a simple color placeholder
  return {
    type: 'color',
    value: '#f3f4f6',
    width: 40,
    height: 40
  };
}

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

// Helper function for generating responsive image configurations
export function createImageConfig(src, options = {}) {
  const {
    alt = '',
    sizes = '100vw',
    priority = false,
    quality = DEFAULT_QUALITY,
    formats = ['webp', 'avif']
  } = options;

  return {
    src: `${src}?optimize=quality=${quality}&formats=${formats.join(',')}`,
    alt,
    sizes,
    priority
  };
}

// Image optimization utilities
export const imageUtils = {
  // Generate sizes attribute for responsive images
  generateSizes: (breakpoints) => {
    return Object.entries(breakpoints)
      .sort(([, a], [, b]) => parseInt(b) - parseInt(a))
      .map(([size, width]) => `(min-width: ${width}px) ${size}`)
      .join(', ');
  },

  // Calculate optimal image dimensions
  calculateOptimalSize: (containerWidth, devicePixelRatio = 1) => {
    const targetWidth = containerWidth * devicePixelRatio;
    return DEFAULT_SIZES.find(size => size >= targetWidth) || DEFAULT_SIZES[DEFAULT_SIZES.length - 1];
  },

  // Get image format support
  getFormatSupport: () => {
    if (typeof window === 'undefined') return { webp: false, avif: false };

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    return {
      webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
      avif: canvas.toDataURL('image/avif').startsWith('data:image/avif')
    };
  }
};
