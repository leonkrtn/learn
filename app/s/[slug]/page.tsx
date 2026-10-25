import Runner from '@/components/Runner';

export const metadata = { title: 'Practice' };

export default function PracticePage() {
  return <Runner mode={{ kind: 'practice' }} />;
}
