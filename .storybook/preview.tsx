import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '../src/index.css';
import { ThemeProvider } from 'next-themes';
import ThemeToggle from '../src/components/ThemeToggle';
import { Toaster } from '../src/components/ui/toaster';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
      },
      defaultViewport: 'mobile',
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" storageKey="wigg-theme">
        <div className="min-h-screen bg-background text-foreground p-4">
          {/* Floating theme toggle for all stories */}
          <div className="fixed top-3 right-3 z-50">
            <ThemeToggle />
          </div>
          <Story />
          <Toaster />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
