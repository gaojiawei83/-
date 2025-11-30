import React from 'react';
import { MuscleId, MuscleData, ViewSide, RecoverySettings } from '../types';
import { getMuscleStatus, getStatusColor } from '../utils';
import BodyPart from './BodyPart';

interface BodyMapProps {
  view: ViewSide;
  muscles: Record<MuscleId, MuscleData>;
  onMuscleClick: (id: MuscleId) => void;
  currentTime: number;
  animatingMuscleId: MuscleId | 'all' | null;
  settings: RecoverySettings;
}

// Coordinate system for labels/indicators
const LABEL_POSITIONS: Record<ViewSide, Partial<Record<MuscleId, { x: number, y: number, align: 'left' | 'right' | 'center' }>>> = {
  front: {
    traps: { x: 200, y: 70, align: 'center' },
    'front-delt': { x: 280, y: 110, align: 'left' }, // Right side
    chest: { x: 200, y: 130, align: 'center' },
    biceps: { x: 285, y: 180, align: 'left' },
    abs: { x: 200, y: 220, align: 'center' },
    quads: { x: 240, y: 360, align: 'left' },
    calves: { x: 225, y: 510, align: 'left' },
  },
  back: {
    traps: { x: 200, y: 110, align: 'center' },
    'rear-delt': { x: 270, y: 110, align: 'left' },
    triceps: { x: 270, y: 170, align: 'left' },
    lats: { x: 240, y: 220, align: 'left' },
    glutes: { x: 200, y: 300, align: 'center' },
    hamstrings: { x: 215, y: 380, align: 'left' },
    calves: { x: 225, y: 480, align: 'left' },
  }
};

const MuscleLabel: React.FC<{ x: number; y: number; level: number; statusColor: string; align: 'left' | 'right' | 'center' }> = ({ x, y, level, statusColor, align }) => {
  const isZero = level <= 1;
  const bg = isZero ? '#1e293b' : statusColor; 
  const text = isZero ? '#64748b' : '#000000';
  
  // Convert visual level to a simpler number or bar
  const displayVal = Math.floor(level);

  if (isZero) return null; // Don't show label if no growth

  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
       <rect 
          x="-12" 
          y="-8" 
          width="24" 
          height="16" 
          rx="4" 
          fill={bg} 
          className="drop-shadow-sm transition-colors duration-500"
          opacity={0.9}
        />
       <text 
        x="0" 
        y="4" 
        textAnchor="middle" 
        fontSize="10" 
        fontWeight="bold" 
        fill={text}
        className="font-sans"
      >
         {displayVal}
       </text>
    </g>
  );
};

const BodyMap: React.FC<BodyMapProps> = ({ view, muscles, onMuscleClick, currentTime, animatingMuscleId, settings }) => {
  
  const getProps = (id: MuscleId, cx: number, cy: number) => {
    const data = muscles[id];
    const status = getMuscleStatus(data.lastWorkoutTimestamp, currentTime, settings);
    const isAnimating = animatingMuscleId === 'all' || animatingMuscleId === id;
    
    // Scale calculation: Use the stored muscleGrowth
    let scale = data.muscleGrowth || 1;
    
    if (isAnimating) {
        scale *= 1.15; // Pulse expansion
    }

    return {
      fill: getStatusColor(status, settings.colors),
      scale,
      onClick: () => onMuscleClick(id),
      isAnimating,
      cx,
      cy
    };
  };

  const renderLabels = () => {
    const positions = LABEL_POSITIONS[view];
    return Object.entries(positions).map(([key, pos]) => {
      const id = key as MuscleId;
      if (!pos || !muscles[id]) return null;
      
      const level = Math.floor((muscles[id].muscleGrowth || 1) * 10 - 9);
      const status = getMuscleStatus(muscles[id].lastWorkoutTimestamp, currentTime, settings);
      
      return (
        <MuscleLabel 
          key={id} 
          x={pos.x} 
          y={pos.y} 
          level={Math.max(1, level)} 
          statusColor={getStatusColor(status, settings.colors)}
          align={pos.align} 
        />
      );
    });
  };

  // Static colors for hands/feet/head
  const skinColor = "#475569";

  if (view === 'front') {
    return (
      <svg viewBox="0 0 400 650" className="w-full h-full max-h-[75vh] drop-shadow-2xl">
        
        {/* --- HEAD & NECK --- */}
        <path d="M185 60 Q180 30 200 30 Q220 30 215 60 L215 80 L185 80 Z" fill={skinColor} />
        
        {/* --- TRAPS (Upper) --- */}
        <BodyPart d="M185 80 L150 95 L160 85 Q180 65 200 65 Q220 65 240 85 L250 95 L215 80 Z" {...getProps('traps', 200, 80)} />

        {/* --- LATS (Front Visible flare) --- */}
        <BodyPart d="M155 160 L140 190 Q145 230 165 240 L165 180 Z" {...getProps('lats', 150, 200)} />
        <BodyPart d="M245 160 L260 190 Q255 230 235 240 L235 180 Z" {...getProps('lats', 250, 200)} />

        {/* --- SHOULDERS (Front Delts) --- */}
        <BodyPart d="M150 95 Q125 95 115 115 Q110 135 120 155 L155 140 Q150 120 150 95 Z" {...getProps('front-delt', 135, 120)} />
        <BodyPart d="M250 95 Q275 95 285 115 Q290 135 280 155 L245 140 Q250 120 250 95 Z" {...getProps('front-delt', 265, 120)} />

        {/* --- CHEST (Pecs) --- */}
        <BodyPart d="M200 95 L200 165 Q170 170 155 155 L155 140 Q160 120 170 100 L200 95 Z" {...getProps('chest', 175, 130)} />
        <BodyPart d="M200 95 L200 165 Q230 170 245 155 L245 140 Q240 120 230 100 L200 95 Z" {...getProps('chest', 225, 130)} />

        {/* --- BICEPS --- */}
        <BodyPart d="M120 155 Q110 180 115 200 L140 195 Q145 175 155 155 Z" {...getProps('biceps', 130, 175)} />
        <BodyPart d="M280 155 Q290 180 285 200 L260 195 Q255 175 245 155 Z" {...getProps('biceps', 270, 175)} />

        {/* --- FOREARMS --- */}
        <path d="M115 200 L105 250 L125 255 L140 195 Z" fill={skinColor} />
        <path d="M285 200 L295 250 L275 255 L260 195 Z" fill={skinColor} />

        {/* --- HANDS (New) --- */}
        <path d="M105 250 Q95 270 100 280 Q110 285 125 280 L125 255 Z" fill={skinColor} />
        <path d="M295 250 Q305 270 300 280 Q290 285 275 280 L275 255 Z" fill={skinColor} />

        {/* --- ABS (Rectus Abdominis) --- */}
        <BodyPart d="M165 170 L235 170 L225 260 L175 260 Z" {...getProps('abs', 200, 215)} />

        {/* --- LEGS (Quads) --- */}
        <BodyPart d="M175 260 Q160 300 155 350 Q160 410 185 430 L200 420 L200 280 L175 260 Z" {...getProps('quads', 175, 345)} />
        <BodyPart d="M225 260 Q240 300 245 350 Q240 410 215 430 L200 420 L200 280 L225 260 Z" {...getProps('quads', 225, 345)} />
        
        {/* --- KNEES --- */}
        <circle cx="190" cy="440" r="12" fill={skinColor} opacity="0.5" />
        <circle cx="210" cy="440" r="12" fill={skinColor} opacity="0.5" />

        {/* --- CALVES --- */}
         <BodyPart d="M185 450 Q170 470 170 500 Q175 540 185 570 L195 560 L195 450 Z" {...getProps('calves', 180, 510)} />
         <BodyPart d="M215 450 Q230 470 230 500 Q225 540 215 570 L205 560 L205 450 Z" {...getProps('calves', 220, 510)} />

        {/* --- FEET (New) --- */}
        <path d="M185 570 Q170 590 160 595 L195 595 L195 560 Z" fill={skinColor} />
        <path d="M215 570 Q230 590 240 595 L205 595 L205 560 Z" fill={skinColor} />

         {/* LABELS OVERLAY */}
         {renderLabels()}

      </svg>
    );
  } else {
    // BACK VIEW
    return (
      <svg viewBox="0 0 400 650" className="w-full h-full max-h-[75vh] drop-shadow-2xl">
        
        {/* Head Back */}
        <path d="M185 60 Q180 30 200 30 Q220 30 215 60 L215 80 L185 80 Z" fill={skinColor} />

        {/* --- TRAPS (Back) --- */}
        <BodyPart d="M200 65 L240 85 L225 140 L200 160 L175 140 L160 85 Z" {...getProps('traps', 200, 110)} />

        {/* --- SHOULDERS (Rear Delts) --- */}
        <BodyPart d="M160 85 L125 100 Q120 120 130 140 L165 125 Z" {...getProps('rear-delt', 145, 115)} />
        <BodyPart d="M240 85 L275 100 Q280 120 270 140 L235 125 Z" {...getProps('rear-delt', 255, 115)} />

        {/* --- TRICEPS --- */}
        <BodyPart d="M130 140 L120 195 Q135 200 150 190 L165 125 Z" {...getProps('triceps', 140, 160)} />
        <BodyPart d="M270 140 L280 195 Q265 200 250 190 L235 125 Z" {...getProps('triceps', 260, 160)} />

         {/* --- FOREARMS (Back) --- */}
        <path d="M120 195 L110 250 L135 255 L150 190 Z" fill={skinColor} />
        <path d="M280 195 L290 250 L265 255 L250 190 Z" fill={skinColor} />

        {/* --- HANDS (New Back) --- */}
        <path d="M110 250 Q100 270 105 280 Q120 285 135 280 L135 255 Z" fill={skinColor} />
        <path d="M290 250 Q300 270 295 280 Q280 285 265 280 L265 255 Z" fill={skinColor} />

        {/* --- LATS (Back) --- */}
        <BodyPart d="M175 140 L155 190 Q160 230 190 260 L200 260 L200 160 Z" {...getProps('lats', 180, 200)} />
        <BodyPart d="M225 140 L245 190 Q240 230 210 260 L200 260 L200 160 Z" {...getProps('lats', 220, 200)} />

        {/* --- GLUTES --- */}
        <BodyPart d="M200 260 L165 265 Q160 300 170 340 L200 340 Z" {...getProps('glutes', 180, 300)} />
        <BodyPart d="M200 260 L235 265 Q240 300 230 340 L200 340 Z" {...getProps('glutes', 220, 300)} />

        {/* --- HAMSTRINGS --- */}
        <BodyPart d="M170 340 L175 420 L200 420 L200 340 Z" {...getProps('hamstrings', 185, 380)} />
        <BodyPart d="M230 340 L225 420 L200 420 L200 340 Z" {...getProps('hamstrings', 215, 380)} />

         {/* --- KNEES (Back) --- */}
         <circle cx="190" cy="430" r="12" fill={skinColor} opacity="0.5" />
         <circle cx="210" cy="430" r="12" fill={skinColor} opacity="0.5" />

        {/* --- CALVES (Back) --- */}
        <BodyPart d="M175 440 Q160 460 165 490 Q180 520 190 550 L195 440 Z" {...getProps('calves', 180, 495)} />
        <BodyPart d="M225 440 Q240 460 235 490 Q220 520 210 550 L205 440 Z" {...getProps('calves', 220, 495)} />

        {/* --- FEET (New Back) --- */}
        <path d="M190 550 L165 570 L195 570 Z" fill={skinColor} />
        <path d="M210 550 L235 570 L205 570 Z" fill={skinColor} />

        {/* LABELS OVERLAY */}
        {renderLabels()}

      </svg>
    );
  }
};

export default BodyMap;