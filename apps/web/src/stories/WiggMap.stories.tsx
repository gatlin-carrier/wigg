import type { Meta, StoryObj } from '@storybook/react';
import { WiggMap } from '../components/wigg/WiggMap';

const meta: Meta<typeof WiggMap> = {
  title: 'Wigg/WiggMap',
  component: WiggMap,
};

export default meta;

type Story = StoryObj<typeof WiggMap>;

export const MovieDense: Story = {
  render: () => (
    <div className="p-6 bg-zinc-950 text-violet-400">
      <WiggMap
        consensus={{
          posKind: 'sec',
          duration: 7200,
          medianPos: 1880,
          windows: [
            { start: 1760, end: 2010, score: 1, label: 'setpiece', isPrimary: true },
            { start: 3600, end: 3840, score: 0.6, label: 'reveal' }
          ],
        }}
        points={Array.from({length: 200}, () => ({ pos: 1760 + Math.random()*260 }))}
        width={680}
        className="text-violet-400"
      />
    </div>
  ),
};

