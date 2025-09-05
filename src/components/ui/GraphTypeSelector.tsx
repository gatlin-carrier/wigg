import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, TrendingUp, BarChart, Radio, Scan } from 'lucide-react';

export type GraphType = 'curve' | 'bars' | 'pulse' | 'barcode';

interface GraphTypeSelectorProps {
  value: GraphType;
  onChange: (type: GraphType) => void;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean; // Show interactive preview of selected type
}

interface GraphTypeOption {
  type: GraphType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: React.ComponentType<{ className?: string }>;
}

// Stylized preview components for each graph type
const CurvePreview = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 60 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    {/* Grid lines */}
    <line x1="0" y1="6" x2="60" y2="6" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
    <line x1="0" y1="12" x2="60" y2="12" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
    <line x1="0" y1="18" x2="60" y2="18" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
    {/* Curve path */}
    <path
      d="M0,20 Q15,16 20,14 T40,8 Q50,6 60,8"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeOpacity="0.8"
    />
    {/* Area fill */}
    <path
      d="M0,24 L0,20 Q15,16 20,14 T40,8 Q50,6 60,8 L60,24 Z"
      fill="url(#curveGradient)"
    />
    {/* Peak points */}
    <circle cx="20" cy="14" r="1.5" fill="currentColor" fillOpacity="0.8" />
    <circle cx="40" cy="8" r="1.5" fill="currentColor" fillOpacity="0.8" />
  </svg>
);

const BarsPreview = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 60 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Bars with varying heights */}
    <rect x="2" y="18" width="10" height="6" rx="1" fill="currentColor" fillOpacity="0.3" />
    <rect x="16" y="14" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.5" />
    <rect x="30" y="10" width="10" height="14" rx="1" fill="currentColor" fillOpacity="0.7" />
    <rect x="44" y="6" width="10" height="18" rx="1" fill="currentColor" fillOpacity="0.9" />
    {/* Labels */}
    <text x="7" y="23" fontSize="4" textAnchor="middle" fill="currentColor" fillOpacity="0.6">zzz</text>
    <text x="21" y="23" fontSize="4" textAnchor="middle" fill="currentColor" fillOpacity="0.6">good</text>
    <text x="35" y="23" fontSize="4" textAnchor="middle" fill="currentColor" fillOpacity="0.6">better</text>
    <text x="49" y="23" fontSize="4" textAnchor="middle" fill="currentColor" fillOpacity="0.6">peak</text>
  </svg>
);

const PulsePreview = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 60 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
        <stop offset="70%" stopColor="currentColor" stopOpacity="0.2" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Pulse circles */}
    <circle cx="30" cy="12" r="8" fill="url(#pulseGradient)" />
    <circle cx="30" cy="12" r="12" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.5" />
    <circle cx="30" cy="12" r="16" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
    {/* Center value */}
    <text x="30" y="11" fontSize="6" textAnchor="middle" fill="currentColor" fontWeight="bold">2.4</text>
    <text x="30" y="17" fontSize="3" textAnchor="middle" fill="currentColor" fillOpacity="0.6">avg</text>
  </svg>
);

const BarcodePreview = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 60 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Barcode segments with varying opacity */}
    {[
      { x: 0, opacity: 0.2 }, { x: 4, opacity: 0.5 }, { x: 8, opacity: 0.7 },
      { x: 12, opacity: 0.9 }, { x: 16, opacity: 0.6 }, { x: 20, opacity: 0.8 },
      { x: 24, opacity: 0.4 }, { x: 28, opacity: 0.9 }, { x: 32, opacity: 0.7 },
      { x: 36, opacity: 0.5 }, { x: 40, opacity: 0.8 }, { x: 44, opacity: 0.6 },
      { x: 48, opacity: 0.9 }, { x: 52, opacity: 0.7 }, { x: 56, opacity: 0.4 }
    ].map((bar, index) => (
      <rect
        key={index}
        x={bar.x}
        y="4"
        width="3"
        height="16"
        fill="currentColor"
        fillOpacity={bar.opacity}
        rx="0.5"
      />
    ))}
    {/* T2G marker */}
    <polygon
      points="24,2 26,4 22,4"
      fill="currentColor"
      fillOpacity="0.8"
    />
    <text x="24" y="1" fontSize="2" textAnchor="middle" fill="currentColor" fillOpacity="0.6">T2G</text>
  </svg>
);

const graphTypeOptions: GraphTypeOption[] = [
  {
    type: 'curve',
    label: 'Curve',
    description: 'Smooth line showing trends',
    icon: TrendingUp,
    preview: CurvePreview,
  },
  {
    type: 'bars',
    label: 'Bar Chart',
    description: 'Bar chart distribution',
    icon: BarChart,
    preview: BarsPreview,
  },
  {
    type: 'pulse',
    label: 'Pulse',
    description: 'Radial average display',
    icon: Radio,
    preview: PulsePreview,
  },
  {
    type: 'barcode',
    label: 'Barcode',
    description: 'Compact dense visualization',
    icon: Scan,
    preview: BarcodePreview,
  },
];

export function GraphTypeSelector({ value, onChange, disabled, className, showPreview = false }: GraphTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = graphTypeOptions.find(option => option.type === value) || graphTypeOptions[0];

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-between h-auto p-3 min-h-[3.5rem] text-left"
            aria-label={`Graph type selector. Currently selected: ${selectedOption.label}`}
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <selectedOption.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                <span className="font-medium text-sm sm:text-base truncate w-full">{selectedOption.label}</span>
                <span className="text-xs text-muted-foreground text-left break-words w-full">
                  {selectedOption.description}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-80 max-w-[calc(100vw-2rem)] p-2" 
          align="start" 
          role="menu"
          sideOffset={4}
        >
          {graphTypeOptions.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => {
                onChange(option.type);
                setIsOpen(false);
              }}
              className="p-0"
              role="menuitemradio"
              aria-checked={value === option.type}
              aria-label={`${option.label}: ${option.description}`}
            >
              <Card className={`w-full border ${value === option.type ? 'border-primary bg-primary/5' : 'border-border'} cursor-pointer hover:bg-accent/50 transition-colors`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <option.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm sm:text-base truncate">{option.label}</span>
                        {value === option.type && (
                          <Check className="h-3 w-3 text-primary flex-shrink-0" aria-label="Selected" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {option.description}
                      </p>
                    </div>
                    <div className="w-12 h-5 sm:w-16 sm:h-6 flex-shrink-0" aria-hidden="true">
                      <option.preview className="w-full h-full text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}