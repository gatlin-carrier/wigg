import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RealtimeWiggOverlay } from '@/components/wigg/RealtimeWiggOverlay';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof RealtimeWiggOverlay> = {
  title: 'Wigg/RealtimeWiggOverlay/Edit Graph Mode',
  component: RealtimeWiggOverlay,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof RealtimeWiggOverlay>;

export const EditModeIntegration: Story = {
  render: function EditModeIntegrationStory() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">RealtimeWiggOverlay with Edit Graph Mode</h1>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Features Demonstrated:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Toggle edit mode with the Edit button in the header</li>
                <li>• Direct WIGG placement on the progress graph</li>
                <li>• All Edit Graph Mode interactions (tap, drag, paint, undo)</li>
                <li>• Keyboard shortcuts: Alt+E for edit toggle, Ctrl+Z for undo</li>
                <li>• Seamless integration with live capture workflow</li>
              </ul>
            </div>
          </div>

          <Button onClick={() => setIsOpen(true)} size="lg">
            Open Realtime WIGG Overlay
          </Button>
        </div>

        <RealtimeWiggOverlay
          titleId="example-game-123"
          titleName="The Witcher 3: Wild Hunt"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mediaType="game"
          estimatedTotalMinutes={3000} // 50 hours
          storybookSafe
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete RealtimeWiggOverlay with Edit Graph Mode integration - shows the full workflow from live capture to direct graph editing',
      },
    },
  },
};

export const EditModeWorkflow: Story = {
  render: function EditModeWorkflowStory() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
      'Open the overlay to begin live capture',
      'Toggle Edit Mode using the Edit button',
      'Place WIGGs directly on the progress graph',
      'Use long-press for precision placement',
      'Try painting segment scores with vertical drags',
      'Use Ctrl+Z or the undo button to undo actions',
      'Toggle back to standard mode to see the difference'
    ];

    return (
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Edit Graph Mode Workflow</h1>
            <p className="text-muted-foreground">
              Follow the guided steps to explore all Edit Graph Mode features
            </p>
          </div>

          {/* Step indicator */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="text-sm">{steps[currentStep]}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Button onClick={() => setIsOpen(true)} size="lg" className="w-full">
                {isOpen ? 'Overlay is Open' : 'Open Realtime WIGG Overlay'}
              </Button>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-secondary rounded">
                  <strong>Standard Mode Features:</strong>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• Scrub timeline position</li>
                    <li>• Mark WIGG at current position</li>
                    <li>• Add optional notes</li>
                    <li>• View recent activity</li>
                  </ul>
                </div>

                <div className="p-3 bg-primary/10 rounded">
                  <strong>Edit Graph Mode Features:</strong>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• Direct WIGG placement anywhere</li>
                    <li>• Drag for fine-tuned positioning</li>
                    <li>• Long-press for precision zoom</li>
                    <li>• Double-tap for quick placement</li>
                    <li>• Paint mode for segment scoring</li>
                    <li>• Undo/redo with full history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <strong className="text-orange-700 dark:text-orange-300">Keyboard Shortcuts:</strong>
                <div className="mt-2 space-y-1 text-xs text-orange-600 dark:text-orange-400">
                  <div><code>Alt+E</code> - Toggle edit mode</div>
                  <div><code>Ctrl+Z</code> - Undo last action</div>
                  <div><code>Ctrl+Enter</code> - Mark WIGG (standard mode)</div>
                  <div><code>Space</code> - Mark WIGG (standard mode)</div>
                  <div><code>Escape</code> - Exit edit mode or close overlay</div>
                  <div><code>Arrow Keys</code> - Navigate in edit mode</div>
                  <div><code>Enter</code> - Confirm placement in edit mode</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <strong className="text-green-700 dark:text-green-300">Touch Gestures:</strong>
                <div className="mt-2 space-y-1 text-xs text-green-600 dark:text-green-400">
                  <div>• Single tap - Place WIGG or scrub</div>
                  <div>• Long press - Precision mode or mark WIGG</div>
                  <div>• Drag - Fine-tune position or scrub</div>
                  <div>• Double-tap - Quick WIGG placement</div>
                  <div>• Vertical drag - Paint segment scores</div>
                  <div>• Three-finger tap - Undo action</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RealtimeWiggOverlay
          titleId="workflow-example"
          titleName="Elden Ring"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mediaType="game"
          estimatedTotalMinutes={4200} // 70 hours
          storybookSafe
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Step-by-step workflow guide showing how to use Edit Graph Mode within the RealtimeWiggOverlay',
      },
    },
  },
};

export const EditModeAccessibility: Story = {
  render: function EditModeAccessibilityStory() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Accessibility Features Demo</h1>
            <p className="text-muted-foreground">
              All Edit Graph Mode features are fully accessible via keyboard, screen readers, and assistive technologies
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <strong className="text-blue-700 dark:text-blue-300">Screen Reader Support:</strong>
                <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                  <li>• Live announcements for mode changes</li>
                  <li>• ARIA labels for all interactive elements</li>
                  <li>• Detailed instructions and context</li>
                  <li>• Progress and status updates</li>
                  <li>• Action confirmations and feedback</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <strong className="text-green-700 dark:text-green-300">Keyboard Navigation:</strong>
                <ul className="mt-2 space-y-1 text-sm text-green-600 dark:text-green-400">
                  <li>• Full keyboard control of all features</li>
                  <li>• Logical tab order and focus management</li>
                  <li>• Clear visual focus indicators</li>
                  <li>• Consistent interaction patterns</li>
                  <li>• No mouse-only functionality</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <strong className="text-purple-700 dark:text-purple-300">High Contrast:</strong>
                <ul className="mt-2 space-y-1 text-sm text-purple-600 dark:text-purple-400">
                  <li>• Clear visual differentiation</li>
                  <li>• Focus rings with high contrast</li>
                  <li>• Status indicators and badges</li>
                  <li>• Color-independent interactions</li>
                  <li>• Dark mode support</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <strong className="text-orange-700 dark:text-orange-300">Motor Accessibility:</strong>
                <ul className="mt-2 space-y-1 text-sm text-orange-600 dark:text-orange-400">
                  <li>• Large touch targets (minimum 44px)</li>
                  <li>• Generous click areas</li>
                  <li>• No precision-required interactions</li>
                  <li>• Alternative input methods</li>
                  <li>• Timeout controls</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={() => setIsOpen(true)} size="lg">
              Test Accessibility Features
            </Button>
          </div>
        </div>

        <RealtimeWiggOverlay
          titleId="accessibility-demo"
          titleName="Accessibility Testing - The Last of Us Part II"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mediaType="game"
          estimatedTotalMinutes={1500} // 25 hours
          storybookSafe
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility testing for Edit Graph Mode - try using keyboard navigation, screen readers, and various assistive technologies',
      },
    },
  },
};
