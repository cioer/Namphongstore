'use client';

import { useState } from 'react';
import { handleImageError } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  
  const imageList = images.length > 0 ? images : ['https://via.placeholder.com/400x400.png?text=No+Image'];

  return (
    <div>
      {/* Main Image */}
      <div style={{
        width: '100%',
        height: '400px',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        marginBottom: '16px'
      }}>
        <img
          src={imageList[selectedImage]}
          alt={`${productName} - ${selectedImage + 1}`}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '20px'
          }}
        />
      </div>

      {/* Thumbnail Images */}
      {imageList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {imageList.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(index)}
              style={{
                width: '80px',
                height: '80px',
                border: selectedImage === index ? '2px solid #1890ff' : '1px solid #f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa'
              }}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${index + 1}`}
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '4px'
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
