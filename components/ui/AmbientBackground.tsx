"use client";

import { useEffect, useRef } from "react";

export default function AmbientBackground() {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (orb1Ref.current && orb2Ref.current) {
        // Orb 1: Figure 8 pattern (Sangat lambat: ~40s loop)
        const x1 = Math.sin(elapsed / 6000) * 35; // 35vw movement
        const y1 = Math.cos(elapsed / 4500) * 25; // 25vh movement
        
        // Orb 2: Abstract circle, opposite phase
        const x2 = Math.cos(elapsed / 7000) * 45;
        const y2 = Math.sin(elapsed / 5000) * 35;

        orb1Ref.current.style.transform = `translate(${x1}vw, ${y1}vh)`;
        orb2Ref.current.style.transform = `translate(${x2}vw, ${y2}vh)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#09090B] pointer-events-none select-none" aria-hidden="true">
      {/* Layer 1: Ambient Orbs */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center">
        <div 
          ref={orb1Ref}
          className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full"
          style={{
            backgroundColor: "rgba(251, 140, 0, 0.15)", // Increased from 0.03 to 0.15
            filter: "blur(150px)",
            mixBlendMode: "screen", // Helps the glow blend better
            willChange: "transform",
          }}
        />
        <div 
          ref={orb2Ref}
          className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full"
          style={{
            backgroundColor: "rgba(251, 140, 0, 0.20)", // Increased from 0.04 to 0.20
            filter: "blur(120px)",
            mixBlendMode: "screen",
            willChange: "transform",
          }}
        />
      </div>

      {/* Layer 2: Grain / Noise (Tekstur premium) */}
      <div 
        className="absolute inset-0 z-[2] opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
