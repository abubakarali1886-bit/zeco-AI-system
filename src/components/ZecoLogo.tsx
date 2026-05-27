/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ZecoLogoProps {
  className?: string;
  size?: number | string;
}

export default function ZecoLogo({ className = '', size = '100%' }: ZecoLogoProps) {
  return (
    <svg 
      viewBox="0 0 300 300" 
      width={size} 
      height={size} 
      className={`select-none shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Definitions for text paths and clipping */}
      <defs>
        {/* Top arch for ZANZIBAR ELECTRICITY (Clockwise, curving up) */}
        <path 
          id="zeco-top-arch" 
          d="M 42,150 A 108,108 0 0,1 258,150" 
          fill="none" 
        />
        
        {/* Bottom arch for CORPORATION (Clockwise, curving down, right-to-left) */}
        <path 
          id="zeco-bottom-arch" 
          d="M 258,150 A 108,108 0 0,1 42,150" 
          fill="none" 
        />

        {/* Inner circle mask/clipping path for the zebra stripes */}
        <clipPath id="zeco-stripes-clip">
          <circle cx="150" cy="150" r="72" />
        </clipPath>
      </defs>

      {/* 1. Outer Red Ring / Background */}
      <circle 
        cx="150" 
        cy="150" 
        r="135" 
        fill="#FFFFFF" 
        stroke="#C1121F" 
        strokeWidth="11" 
      />

      {/* 2. Middle Black Border (between white text band and striped center) */}
      <circle 
        cx="150" 
        cy="150" 
        r="77" 
        fill="none" 
        stroke="#000000" 
        strokeWidth="3" 
      />

      {/* 3. Curved Circular Headings */}
      {/* Top Text: ZANZIBAR ELECTRICITY */}
      <text 
        fill="#000000" 
        fontSize="17.5" 
        fontWeight="800" 
        letterSpacing="2.8"
        fontFamily="'Century Gothic', 'Inter', 'Segoe UI', sans-serif"
      >
        <textPath 
          href="#zeco-top-arch" 
          startOffset="50%" 
          textAnchor="middle"
        >
          ZANZIBAR ELECTRICITY
        </textPath>
      </text>

      {/* Bottom Text: CORPORATION */}
      <text 
        fill="#000000" 
        fontSize="18" 
        fontWeight="800" 
        letterSpacing="3.5"
        fontFamily="'Century Gothic', 'Inter', 'Segoe UI', sans-serif"
      >
        <textPath 
          href="#zeco-bottom-arch" 
          startOffset="50%" 
          textAnchor="middle"
        >
          CORPORATION
        </textPath>
      </text>

      {/* 4. Striped Center Section with 'ZECO' and Lightning Bolt */}
      <g clipPath="url(#zeco-stripes-clip)">
        {/* White background inside the stripes area */}
        <rect x="70" y="70" width="160" height="160" fill="#FFFFFF" />

        {/* Black Horizontal Stripes - Upper Panel */}
        <rect x="70" y="78" width="160" height="13" fill="#000000" />
        <rect x="70" y="97" width="160" height="13" fill="#000000" />
        <rect x="70" y="116" width="160" height="13" fill="#000000" />

        {/* Black Horizontal Stripes - Lower Panel */}
        <rect x="70" y="171" width="160" height="13" fill="#000000" />
        <rect x="70" y="190" width="160" height="13" fill="#000000" />
        <rect x="70" y="209" width="160" height="13" fill="#000000" />

        {/* Central White Track where the word ZECO sits */}
        {/* We place text "ZECO" in bold condensed style */}
        <text 
          x="151.5" 
          y="164" 
          fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif" 
          fontSize="54" 
          fontStretch="condensed"
          align-baseline="middle"
          fontWeight="900" 
          fill="#000000" 
          textAnchor="middle" 
          letterSpacing="-0.5"
        >
          ZECO
        </text>
      </g>

      {/* Inner outline of the white track circle boundary for clean alignment */}
      <circle 
        cx="150" 
        cy="150" 
        r="72.5" 
        fill="none" 
        stroke="#000000" 
        strokeWidth="1.5" 
      />

      {/* 5. Center Vertical Red Lightning Bolt */}
      {/* We overlay this on top of the text and stripes. White stroke separates elements beautifully. */}
      <polygon 
        points="164,74 152.5,142 161,142 136,226 146.5,152 138,152" 
        fill="#C1121F" 
        stroke="#FFFFFF" 
        strokeWidth="3" 
        strokeLinejoin="miter" 
        filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.15))"
      />
    </svg>
  );
}
