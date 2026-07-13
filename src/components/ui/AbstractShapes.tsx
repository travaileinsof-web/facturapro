import React from 'react';
import { motion } from 'framer-motion';

interface AbstractShapeProps {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  opacity?: number;
}

// ── Shape 1 : Geometric Blob
export function BlobShape({ className, style, color = 'var(--color-gold)', opacity = 0.15 }: AbstractShapeProps) {
  return (
    <motion.div 
      className={className} 
      style={{ position: 'absolute', opacity, pointerEvents: 'none', zIndex: 0, ...style }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -40, 20, 0],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.05, 0.95, 1]
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path fill={color} d="M42.7,-73.4C55.9,-67.2,67.6,-57.1,75.3,-44.6C83,-32.1,86.6,-17.1,87.4,-1.8C88.2,13.6,86.2,29.3,77.7,40.8C69.3,52.4,54.3,59.8,40.3,67C26.3,74.2,13.1,81.1,0.2,80.7C-12.7,80.4,-25.4,72.7,-38.7,64.9C-52,57.1,-65.9,49.1,-73.9,37C-81.9,24.8,-84.1,8.5,-80.7,-6.2C-77.3,-21,-68.4,-34.2,-57.5,-44.1C-46.6,-54.1,-33.7,-60.7,-20.9,-65.8C-8.2,-71,4.4,-74.7,18.4,-77.2C32.4,-79.7,46.4,-81.1,42.7,-73.4Z" transform="translate(100 100)" />
      </svg>
    </motion.div>
  );
}

// ── Shape 2 : Floating Golden Geometry (Nouvelles lignes fines et cercles)
export function GeometricShapes({ className, style, opacity = 0.4 }: AbstractShapeProps) {
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', ...style }}>
      {/* Ligne fine dorée 1 */}
      <motion.div
        style={{ position: 'absolute', top: '20%', left: '-10%', width: '120%', height: '1px', background: 'var(--color-gold)', opacity: 0.3 }}
        animate={{ y: [0, 40, -40, 0], rotate: [2, -2, 2] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Ligne fine dorée 2 */}
      <motion.div
        style={{ position: 'absolute', top: '70%', left: '-10%', width: '120%', height: '1px', background: 'var(--color-gold)', opacity: 0.2 }}
        animate={{ y: [0, -50, 50, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Cercle doré flottant 1 */}
      <motion.div
        style={{ position: 'absolute', top: '30%', left: '15%', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid var(--color-gold)', opacity: 0.15 }}
        animate={{ x: [0, 80, -40, 0], y: [0, 60, -30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      {/* Cercle doré flottant 2 */}
      <motion.div
        style={{ position: 'absolute', top: '60%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', border: '1px dashed var(--color-gold)', opacity: 0.1 }}
        animate={{ x: [0, -60, 60, 0], y: [0, -80, 40, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ── Shape 3 : Elegant Waves
export function WavesShape({ className, style, color = 'var(--color-gold)', opacity = 0.1 }: AbstractShapeProps) {
  return (
    <motion.div 
      className={className} 
      style={{ position: 'absolute', opacity, pointerEvents: 'none', zIndex: 0, ...style }}
      animate={{ y: [0, -20, 20, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        <path fill={color} fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,138.7C960,128,1056,160,1152,186.7C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </motion.div>
  );
}

// ── Shape 4 : Grid Lines Pattern
export function GridPattern({ className, style, color = 'var(--color-gold)', opacity = 0.15 }: AbstractShapeProps) {
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none', zIndex: 0, ...style }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
