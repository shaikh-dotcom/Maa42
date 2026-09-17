import React from 'react';

interface Maa42LogoProps {
  className?: string;
  size?: number | string;
}

export const Maa42Logo: React.FC<Maa42LogoProps> = ({
  className = 'w-10 h-10',
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
      aria-label="Maa42 Maternal Care Logo"
    >
      {/* 
        Maa42 Maternal Care Brand Mark:
        Features the '42' symbolizing the 42-day sacred postpartum fourth trimester.
        Deep Teal '#12646D' represents the maternal figure and nurturing embrace ('4').
        Warm Coral '#F06652' represents the thriving newborn and warmth of care ('2').
      */}
      <g transform="translate(0, 0)">
        {/* Teal Shape: Number '4' / Mother's Embrace */}
        <path
          d="M 264 92 
             C 246 95 210 128 178 172 
             C 142 222 114 278 111 316 
             C 107 358 132 372 170 372 
             L 218 372 
             C 208 348 202 320 202 292 
             C 202 245 220 212 250 210 
             C 272 208 284 228 280 258 
             C 274 290 252 318 226 338 
             C 216 346 212 356 212 372 
             C 212 396 226 430 248 450 
             C 252 440 250 422 244 402 
             C 238 376 236 358 248 334 
             C 264 292 300 262 302 220 
             C 304 172 278 152 246 178 
             C 208 210 168 266 148 318 
             C 140 338 144 350 160 350 
             C 182 350 208 296 232 232 
             C 258 162 298 108 312 96 
             C 300 90 282 89 264 92 Z"
          fill="#136B73"
        />

        {/* Coral Shape: Number '2' */}
        <path
          d="M 302 208 
             C 286 208 280 220 284 234 
             C 288 248 300 250 310 242 
             C 330 226 360 230 378 254 
             C 398 280 408 318 388 360 
             C 366 408 322 438 282 454 
             C 264 461 258 469 260 478 
             C 262 486 274 489 290 487 
             C 324 482 380 482 406 478 
             C 418 476 424 466 420 455 
             C 416 446 405 444 391 444 
             C 358 444 322 446 300 449 
             C 336 430 378 400 402 355 
             C 426 310 423 264 395 231 
             C 370 202 334 200 302 208 Z"
          fill="#EE6C58"
        />

        {/* Coral Baby Dot */}
        <circle cx="295" cy="324" r="28" fill="#EE6C58" />
      </g>
    </svg>
  );
};
