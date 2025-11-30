import React from 'react';

interface BodyPartProps {
  d: string; // SVG path data
  fill: string;
  scale: number;
  onClick: () => void;
  className?: string;
  cx?: number; // Center X for scaling transform
  cy?: number; // Center Y for scaling transform
  isAnimating?: boolean;
}

const BodyPart: React.FC<BodyPartProps> = ({ d, fill, scale, onClick, className, cx = 0, cy = 0, isAnimating }) => {
  
  // When animating (pump effect), we make it very bright and add a gold drop shadow
  const animationClasses = isAnimating 
    ? "brightness-125 drop-shadow-[0_0_15px_rgba(250,204,21,0.9)] stroke-white stroke-2 z-10" 
    : "stroke-[rgba(0,0,0,0.5)] stroke-1";

  return (
    <path
      d={d}
      fill={fill}
      onClick={onClick}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={`cursor-pointer transition-all duration-300 ease-out hover:brightness-110 hover:drop-shadow-lg ${animationClasses} ${className || ''}`}
      style={{
        transformOrigin: `${cx}px ${cy}px`,
        transform: `scale(${scale})`,
        transformBox: 'view-box' 
      }}
    />
  );
};

export default BodyPart;