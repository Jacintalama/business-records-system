'use client';

import React from 'react';
import Image from 'next/image';

export default function Skyline() {
  return (
    <div className="relative flex items-center justify-center h-40 overflow-hidden">
      <Image
        src="/maasim.png" // Ensure this is a high-resolution image in your /public folder
        alt="City Skyline"
        fill
        quality={100} // Increase quality to avoid blurring
        className="object-cover object-bottom"
        priority
      />
    </div>
  );
}
