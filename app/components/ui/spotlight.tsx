"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "../../lib/stores/theme";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className = "", fill }: SpotlightProps) {
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

    // Mouse position
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 4;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient spotlight
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 600);

      if (resolvedTheme === "light") {
        gradient.addColorStop(0, "rgba(63, 63, 70, 0.15)"); // zinc-700 with low opacity
        gradient.addColorStop(0.5, "rgba(63, 63, 70, 0.05)");
        gradient.addColorStop(1, "rgba(63, 63, 70, 0)");
      } else {
        gradient.addColorStop(0, fill || "rgba(255, 255, 255, 0.15)");
        gradient.addColorStop(0.5, fill || "rgba(255, 255, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [fill, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  );
}
