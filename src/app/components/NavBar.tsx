'use client';

import Image from 'next/image';
import React from 'react';

export default function NavBar() {
  return (
    <div className="bg-green-600 py-4 w-full">
      {/* A single row (flex) with minimal padding (px-2) to keep the logo close to the edge */}
      <div className="flex items-center justify-between px-2 text-white w-full">
        {/* Left section: Logo + Title/Text */}
        <div className="flex items-center space-x-2">
          <Image
            src="/Logo1.png"
            alt="Left Logo"
            width={180}
            height={10}
            className="object-contain"
          />
          <div>
            <h2 className="text-xl font-bold">Business Records</h2>
            <p className="text-sm">Municipality of Maasim, Sarangani</p>
          </div>
        </div>

        {/* Right Logo (optional) */}
        <Image
          src="/Logo2.png"
          alt="Right Logo"
          width={90}
          height={50}
          className="object-contain"
        />
      </div>
    </div>
  );
}
