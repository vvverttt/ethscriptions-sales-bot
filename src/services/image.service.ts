import { Injectable } from '@nestjs/common';

import { InscriptionMetadata } from '@/models/inscription';

import { createCanvas, Image, registerFont } from 'canvas';
import { mkdir, writeFile } from 'fs/promises';

import path from 'path';
import sharp from 'sharp';

/**
 * Service for generating notification images
 */
@Injectable()
export class ImageService {

  /**
   * Generates an image for an inscription
   * @param hashId The hash ID of the inscription
   * @param value The value of the inscription
   * @param txHash The transaction hash of the inscription
   * @param imageUri The URI of the inscription image
   * @param collectionMetadata The metadata of the collection
   * @returns The generated image as a buffer
   */
  async generate(
    hashId: string,
    value: string,
    txHash: string,
    imageUri: string,
    collectionMetadata: InscriptionMetadata,
  ) {
    return await (Number(process.env.CARD_GEN_ENABLED) 
      ? this.generateCardImage(hashId, value, txHash, imageUri, collectionMetadata)
      : this.generateBasicImage(hashId, value, txHash, imageUri, collectionMetadata)
    );
  }

  /**
   * Generates a basic image for an inscription
   * @param hashId The hash ID of the inscription
   * @param value The value of the inscription
   * @param txHash The transaction hash of the inscription
   * @param imageUri The URI of the inscription image
   * @param collectionMetadata The metadata of the collection
   * @returns The generated image as a buffer
   */
  async generateBasicImage(
    hashId: string,
    value: string,
    txHash: string,
    imageUri: string,
    collectionMetadata: InscriptionMetadata,
  ) {
    // Create a temporary canvas at original size first
    const tempCanvas = createCanvas(1200, 1200);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;

    const inscriptionImg = await this.createInscriptionImage(imageUri);

    // Calculate height maintaining aspect ratio
    const aspectRatio = inscriptionImg.height / inscriptionImg.width;
    const scaledHeight = Math.round(1200 * aspectRatio);

    // Create final canvas with correct dimensions
    const canvas = createCanvas(1200, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;  // Critical for pixel art!

    // Draw background
    ctx.fillStyle = '#C3FF00';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image at original size first, then scale
    tempCtx.drawImage(inscriptionImg, 0, 0, inscriptionImg.width, inscriptionImg.height);
    ctx.drawImage(tempCanvas, 0, 0, inscriptionImg.width, inscriptionImg.height, 
                 0, 0, canvas.width, canvas.height);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    return buffer;
  }

  /**
   * Generates an image for an inscription
   * @param hashId The hash ID of the inscription
   * @param value The value of the inscription
   * @param txHash The transaction hash of the inscription
   * @param imageUri The URI of the inscription image
   * @param collectionMetadata The metadata of the collection
   * @returns The generated image as a buffer
   */
  async generateCardImage(
    hashId: string,
    value: string,
    txHash: string,
    imageUri: string,
    collectionMetadata: InscriptionMetadata,
  ) {
    const { collectionName, collectionImageUri, websiteLink } = collectionMetadata;

    // Register custom font
    registerFont(
      path.join(__dirname, '../../src/assets/fonts/enter-the-gungeon-small.ttf'),
      { family: 'RetroComputer' },
    );

    const backgroundColor = '#C3FF00'; //C3FF00
    const textColor = '#000000';
    const borderColor = '#000000';
    const borderWidth = 16;

    const canvasWidth = 1200;
    const canvasHeight = 1470;
    const padding = 80;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // add black background to top 3rd of canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight / 4);

    // Add collection image
    const collectionImageSize = 100;
    if (collectionImageUri) {
      const collectionImage = await fetch(collectionImageUri);
      const collectionImageBuffer = await collectionImage.arrayBuffer();
      const collectionImageData = new Uint8Array(collectionImageBuffer);
      const collectionImg = new Image();
      collectionImg.src = Buffer.from(collectionImageData);
      ctx.drawImage(
        collectionImg,
        padding + borderWidth / 2,
        padding,
        collectionImageSize,
        collectionImageSize,
      );
    }

    // Add collection name to top
    ctx.fillStyle = backgroundColor;
    ctx.font = 'normal 60px RetroComputer';
    const collectionNameHeight = 50;
    ctx.fillText(
      collectionName.toUpperCase(),
      collectionImageUri ? (padding + collectionImageSize + 40) : (padding + 10),
      padding + collectionNameHeight + 5,
    );

    // Add collection url
    ctx.fillStyle = backgroundColor;
    ctx.font = 'normal 30px RetroComputer';
    const collectionUrl = websiteLink.replace('https://', '');
    const collectionUrlHeight = 20;
    ctx.fillText(
      collectionUrl.toUpperCase(),
      collectionImageUri ? (padding + collectionImageSize + 40) : (padding + 10),
      padding + collectionNameHeight + collectionUrlHeight + 30,
    );

    const inscriptionImg = await this.createInscriptionImage(imageUri);
    const imageWidth = canvasWidth - (padding * 2) - borderWidth;
    const imageHeight = canvasWidth - (padding * 2) - borderWidth;

    // Add a background to the image
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      padding + borderWidth / 2,
      padding + collectionNameHeight + collectionUrlHeight + 50 + (padding / 2) + borderWidth / 2,
      imageWidth,
      imageHeight,
    );
    
    // Add the inscription image
    ctx.drawImage(
      inscriptionImg,
      padding + borderWidth / 2,
      padding + collectionNameHeight + collectionUrlHeight + 50 + (padding / 2) + borderWidth / 2,
      imageWidth,
      imageHeight,
    );

    // Add border to image
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      padding,
      padding + collectionNameHeight + collectionUrlHeight + 40 + (padding / 2),
      canvasWidth - (padding * 2),
      canvasWidth - (padding * 2),
    );

    // Add ethscription name to bottom under image
    ctx.fillStyle = textColor;
    ctx.font = 'normal 80px RetroComputer';
    const itemNameWidth = ctx.measureText(collectionMetadata.itemName).width;
    const maxWidth = canvasWidth - (padding * 2);
    let yPosition = canvasHeight - padding;
    
    if (itemNameWidth > maxWidth) {
      ctx.font = 'normal 60px RetroComputer';
      const newWidth = ctx.measureText(collectionMetadata.itemName).width;
      
      if (newWidth > maxWidth) {
        // Break into two lines
        const words = collectionMetadata.itemName.split(' ');
        let line1 = '';
        let line2 = '';
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine;
          } else {
            if (!line1) {
              line1 = currentLine;
              currentLine = word;
            } else {
              line2 = currentLine;
              currentLine = word;
            }
          }
        }
        
        if (!line2) {
          line2 = currentLine;
        }
        
        // Adjust vertical position for two lines
        // Move up to accommodate second line
        yPosition = canvasHeight - padding - 30;
        
        ctx.fillText(
          line1.toUpperCase(),
          padding,
          yPosition,
        );
        ctx.fillText(
          line2.toUpperCase(),
          padding,
          yPosition + 60, // Add line height for second line
        );
      } else {
        ctx.fillText(
          collectionMetadata.itemName.toUpperCase(),
          padding,
          yPosition,
        );
      }
    } else {
      ctx.fillText(
        collectionMetadata.itemName.toUpperCase(),
        padding,
        yPosition,
      );
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Creates an image from a data URI (SVG or PNG)
   * @param imageUri The URI of the inscription image
   * @returns The generated image as a buffer
   */
  async createInscriptionImage(imageUri: string) {
    // Create Image
    const inscriptionImg = new Image();
    try {
      let imageBuffer: Buffer;
      if (imageUri.startsWith('data:image/svg+xml')) {
        // Convert URL-encoded SVG data URI to buffer
        const svgContent = decodeURIComponent(imageUri.split(',')[1]);
        const svgBuffer = Buffer.from(svgContent);
        // Convert SVG to PNG using Sharp
        imageBuffer = await sharp(svgBuffer)
          .png()
          .toBuffer();
      } else {
        // Regular URL - fetch and convert if SVG
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();
        const fetchedBuffer = Buffer.from(arrayBuffer);
        
        if (imageUri.endsWith('.svg')) {
          imageBuffer = await sharp(fetchedBuffer)
            .png()
            .toBuffer();
        } else {
          imageBuffer = fetchedBuffer;
        }
      }
      
      inscriptionImg.src = imageBuffer;
    } catch (error) {
      console.error('Error loading inscription image:', error);
    }

    return inscriptionImg;
  }

  /**
   * Saves an image to a file
   * @param collectionName The name of the collection
   * @param hashId The hash ID of the inscription
   * @param imageBuffer The image to save
   */
  async saveImage(
    collectionName: string,
    hashId: string,
    imageBuffer: Buffer,
  ) {
    const folderPath = path.join(__dirname, `../../_static`);
    await mkdir(folderPath, { recursive: true });

    await writeFile(
      path.join(folderPath, `${collectionName}--${hashId}.png`),
      imageBuffer,
    );
  }
}
