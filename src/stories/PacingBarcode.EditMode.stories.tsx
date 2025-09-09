import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { PacingBarcode } from '@/components/wigg/PacingBarcode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const meta: Meta<typeof PacingBarcode> = {
  title: 'Wigg/PacingBarcode/Edit Graph Mode',
  component: PacingBarcode,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof PacingBarcode>;

// Mock segments data
const mockSegments = Array.from({ length: 20 }, (_, i) => ({
  startPct: (i / 20) * 100,
  endPct: ((i + 1) / 20) * 100,
  meanScore: Math.random() * 4, // 0-4 scale
  userScore: Math.random() > 0.7 ? Math.random() * 4 : undefined,
}));

// Game that starts slow but gets great
const slowStartSegments = Array.from({ length: 20 }, (_, i) => {
  const position = i / 19;
  let score: number;
  
  if (position < 0.3) {
    score = 0.5 + Math.random() * 1; // 0.5-1.5 early
  } else if (position < 0.6) {
    score = 1.5 + Math.random() * 1.5 + (position - 0.3) * 3; // Rising
  } else {
    score = 3 + Math.random() * 1; // 3-4 late
  }

  return {
    startPct: (i / 20) * 100,
    endPct: ((i + 1) / 20) * 100,
    meanScore: Math.min(4, score),
  };
});

export const EditModeBasic: Story = {
  args: {
    titleId: 'edit-basic',
    height: 60,
    segmentCount: 25,
    segments: mockSegments,
    t2gEstimatePct: 42,
    editable: true,
    showFisheye: true,
    suppressGlobalListeners: true,
    suppressHaptics: true,
  },
  render: function EditModeBasicStory(args) {
    const [wiggPoints, setWiggPoints] = useState<Array<{id: string; pct: number; note?: string}>>([]);
    const { toast } = useToast();

    const handlePlaceWigg = useCallback(async (pct: number, note?: string) => {
      const newWigg = { id: `wigg_${Date.now()}`, pct, note };
      setWiggPoints(prev => [...prev, newWigg]);
      
      toast({
        title: 'WIGG Placed!',
        description: `Marked at ${pct.toFixed(1)}%${note ? `: ${note}` : ''}`,
        duration: 2000
      });
    }, [toast]);

    const handlePaintSegmentScore = useCallback(async (pct: number, score: number) => {
      console.log(`Paint segment at ${pct.toFixed(1)}% with score ${score}`);
    }, []);

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <Badge variant="outline">Edit Graph Mode Active</Badge>
          <div className="mt-2">
            <strong>Instructions:</strong> Tap to place WIGG • Drag to fine-tune • Long-press for precision zoom
          </div>
        </div>
            <PacingBarcode 
              {...args}
              onPlaceWigg={handlePlaceWigg}
              onPaintSegmentScore={handlePaintSegmentScore}
            />
        
        {/* Display placed WIGGs */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Placed WIGGs:</div>
          {wiggPoints.length === 0 ? (
            <div className="text-xs text-muted-foreground">No WIGGs placed yet</div>
          ) : (
            wiggPoints.map(wigg => (
              <div key={wigg.id} className="text-xs bg-secondary p-2 rounded">
                <strong>{wigg.pct.toFixed(1)}%</strong>
                {wigg.note && <span> - {wigg.note}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic Edit Graph Mode - click anywhere to place WIGG points with precision control',
      },
    },
  },
};

export const EditModeToggleable: Story = {
  render: function EditModeToggleableStory() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [wiggPoints, setWiggPoints] = useState<Array<{id: string; pct: number; action: 'place'|'paint'}>>([]);
    const { toast } = useToast();

    const handlePlaceWigg = useCallback(async (pct: number) => {
      const newWigg = { id: `wigg_${Date.now()}`, pct, action: 'place' as const };
      setWiggPoints(prev => [...prev, newWigg]);
      
      toast({
        title: 'WIGG Placed!',
        description: `Marked at ${pct.toFixed(1)}%`,
        duration: 1500
      });
    }, [toast]);

    const handlePaintSegmentScore = useCallback(async (pct: number, score: number) => {
      const paintAction = { id: `paint_${Date.now()}`, pct, action: 'paint' as const };
      setWiggPoints(prev => [...prev, paintAction]);
      
      toast({
        title: 'Segment Painted',
        description: `Score ${score} at ${pct.toFixed(1)}%`,
        duration: 1000
      });
    }, [toast]);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? 'default' : 'outline'}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          </Button>
          <Badge variant={isEditMode ? 'default' : 'secondary'}>
            {isEditMode ? 'Edit Mode Active' : 'Standard Mode'}
          </Badge>
        </div>

        <PacingBarcode
          titleId="edit-toggleable"
          height={60}
          segmentCount={25}
          segments={mockSegments}
          t2gEstimatePct={42}
          editable={isEditMode}
          interactive={!isEditMode}
          showFisheye={true}
          onPlaceWigg={handlePlaceWigg}
          onPaintSegmentScore={handlePaintSegmentScore}
        />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-2">Standard Mode:</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Click to scrub position</li>
              <li>• Long press to mark WIGG</li>
              <li>• Drag for continuous scrubbing</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Edit Mode:</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Tap to place WIGG points</li>
              <li>• Drag for fine-tuning</li>
              <li>• Long press for precision zoom</li>
              <li>• Double-tap for quick placement</li>
              <li>• Vertical drag to paint scores</li>
              <li>• Undo with Ctrl+Z or 3-finger tap</li>
            </ul>
          </div>
        </div>

        {/* Activity log */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Activity Log ({wiggPoints.length}):</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {wiggPoints.slice(-5).reverse().map(point => (
              <div key={point.id} className="text-xs bg-muted p-2 rounded flex items-center gap-2">
                <Badge variant={point.action === 'place' ? 'default' : 'secondary'}>
                  {point.action === 'place' ? 'WIGG' : 'Paint'}
                </Badge>
                <span>{point.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle between standard and edit modes to see the difference in interaction patterns',
      },
    },
  },
};

export const EditModePaintingDemo: Story = {
  render: function EditModePaintingDemoStory() {
    const [paintStrokes, setPaintStrokes] = useState<Array<{pct: number; score: number}>>([]);
    const { toast } = useToast();

    const handlePaintSegmentScore = useCallback(async (pct: number, score: number) => {
      setPaintStrokes(prev => [...prev, { pct, score }]);
      
      // Simulate EMA smoothing visualization
      toast({
        title: 'Paint Stroke',
        description: `Score ${score} at ${pct.toFixed(1)}%`,
        duration: 800
      });
    }, [toast]);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Badge>Paint Mode Demo</Badge>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>How to Paint:</strong> Hold down and drag vertically while moving horizontally.
            Higher = better score, Lower = worse score. Release to commit the paint stroke.
          </div>
        </div>

        <PacingBarcode
          titleId="paint-demo"
          height={60} // Standardized height
          segmentCount={20}
          segments={mockSegments}
          t2gEstimatePct={45}
          editable={true}
          showFisheye={true}
          onPaintSegmentScore={handlePaintSegmentScore}
        />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Paint Strokes ({paintStrokes.length}):</div>
          <div className="grid grid-cols-4 gap-2">
            {paintStrokes.slice(-8).map((stroke, i) => (
              <div key={i} className="text-xs bg-gradient-to-r from-red-100 to-green-100 dark:from-red-950 dark:to-green-950 p-2 rounded">
                <div className="font-mono">{stroke.pct.toFixed(1)}%</div>
                <div className="text-muted-foreground">Score: {stroke.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Press-to-Paint functionality - drag vertically while moving horizontally to paint segment scores',
      },
    },
  },
};

export const EditModeAccessibility: Story = {
  args: {
    titleId: 'edit-a11y',
    height: 60,
    segmentCount: 20,
    segments: mockSegments,
    t2gEstimatePct: 35,
    editable: true,
  },
  render: function EditModeAccessibilityStory(args) {
    const [announcements, setAnnouncements] = useState<string[]>([]);
    const { toast } = useToast();

    const handlePlaceWigg = useCallback(async (pct: number) => {
      const announcement = `WIGG placed at ${pct.toFixed(1)} percent`;
      setAnnouncements(prev => [announcement, ...prev.slice(0, 4)]);
      
      toast({
        title: 'WIGG Placed',
        description: announcement,
        duration: 2000
      });
    }, [toast]);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">Accessibility Features</Badge>
          </div>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <div><strong>Keyboard:</strong> Tab to focus, Arrow keys to navigate, Enter to place, Ctrl+Z to undo</div>
            <div><strong>Screen Reader:</strong> Full ARIA support with live announcements</div>
            <div><strong>Focus:</strong> High-contrast focus indicators</div>
          </div>
        </div>

        <PacingBarcode 
          {...args}
          onPlaceWigg={handlePlaceWigg}
        />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Screen Reader Announcements:</div>
          <div className="bg-muted p-3 rounded text-xs font-mono max-h-24 overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="text-muted-foreground">No announcements yet - try placing a WIGG</div>
            ) : (
              announcements.map((announcement, i) => (
                <div key={i} className={i === 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  {announcement}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including keyboard navigation, ARIA support, and screen reader announcements',
      },
    },
  },
};

export const EditModeComparison: Story = {
  render: function EditModeComparisonStory() {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Standard Interactive Mode</Badge>
            </div>
            <PacingBarcode
              titleId="comparison-standard"
              height={60}
              segmentCount={20}
              segments={slowStartSegments}
              t2gEstimatePct={58}
              interactive={true}
              currentPct={25}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Click to scrub timeline position</div>
              <div>• Long press to mark current WIGG</div>
              <div>• Drag for continuous scrubbing</div>
              <div>• Read-only visualization</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Edit Graph Mode</Badge>
            </div>
            <PacingBarcode
              titleId="comparison-edit"
              height={60}
              segmentCount={20}
              segments={slowStartSegments}
              t2gEstimatePct={58}
              editable={true}
              showFisheye={true}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Tap to place WIGG points anywhere</div>
              <div>• Drag for fine-tuned positioning</div>
              <div>• Long press for precision zoom</div>
              <div>• Double-tap for quick placement</div>
              <div>• Paint mode for segment scoring</div>
              <div>• Undo/redo with full history</div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          Compare the interaction patterns: Standard mode is for consumption, Edit mode is for creation
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of standard interactive mode vs edit graph mode',
      },
    },
  },
};
