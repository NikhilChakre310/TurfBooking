'use client';

import React, { useState, useEffect } from 'react';

export default function FrameAnimation({ className = '' }) {
  const [frame, setFrame] = useState(1);
  const [preloaded, setPreloaded] = useState(false);
  const totalFrames = 51;

  // Preload all frames to memory to prevent rendering flicker
  useEffect(() => {
    let loadedCount = 0;
    const imagesCache = [];

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/images/pickleball-frames/ezgif-frame-${frameNum}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setPreloaded(true);
        }
      };
      imagesCache.push(img);
    }
  }, []);

  // Frame cycler logic
  useEffect(() => {
    if (!preloaded) return;

    const fps = 25; // 25 frames per second
    const intervalTime = 1000 / fps;

    const timer = setInterval(() => {
      setFrame((prev) => (prev % totalFrames) + 1);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [preloaded]);

  const currentFrameSrc = `/images/pickleball-frames/ezgif-frame-${String(frame).padStart(3, '0')}.jpg`;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading Skeleton */}
      {!preloaded && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-500">
          Caching animation frames...
        </div>
      )}

      {/* Render Active Frame */}
      {preloaded && (
        <img
          src={currentFrameSrc}
          alt="Pickleball Action Animation"
          className="w-full h-full object-cover transition-opacity duration-150 brightness-95 contrast-105"
          style={{ objectPosition: 'center' }}
        />
      )}
    </div>
  );
}
