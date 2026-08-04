'use client';

import { useRef, useEffect } from 'react';

export default function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number, points: any[], raf: number;

    function resize() {
      width = canvas!.offsetWidth;
      height = canvas!.offsetHeight;
      canvas!.width = width * devicePixelRatio;
      canvas!.height = height * devicePixelRatio;
      ctx!.scale(devicePixelRatio, devicePixelRatio);

      const count = Math.floor((width * height) / 14000);
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.4 + 0.6,
      }));
    }

    function tick() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx!.strokeStyle = `rgba(212,160,23,${0.14 * (1 - dist / 110)})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      for (const p of points) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(212,160,23,0.55)';
        ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
