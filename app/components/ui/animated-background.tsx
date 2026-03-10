"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "../../lib/stores/theme";

interface AnimatedBackgroundProps {
  className?: string;
  starCount?: number;
}

export function AnimatedBackground({ className = "", starCount = 200 }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Theme-aware star configuration
    const getStarConfig = () => {
      if (resolvedTheme === "light") {
        return {
          color: "#52525b", // zinc-600 for better visibility in light theme
          minOpacity: 0.3,
          maxOpacity: 0.8,
        };
      } else {
        return {
          color: "#ffffff", // white for dark theme
          minOpacity: 0.2,
          maxOpacity: 1.0,
        };
      }
    };

    const starConfig = getStarConfig();

    // Create stars
    const stars: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
      fadeDirection: number;
    }> = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity:
          Math.random() * (starConfig.maxOpacity - starConfig.minOpacity) + starConfig.minOpacity,
        fadeDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }

    // Animation loop
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Update opacity for twinkling effect
        star.opacity += star.fadeDirection * 0.003;
        if (star.opacity >= starConfig.maxOpacity) {
          star.fadeDirection = -1;
        } else if (star.opacity <= starConfig.minOpacity) {
          star.fadeDirection = 1;
        }

        // Draw star with theme-aware color
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${starConfig.color}${Math.floor(star.opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  );
}
