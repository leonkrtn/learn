import Runner from '@/components/Runner';

export const metadata = { title: 'Review' };

export default function ReviewPage() {
  return <Runner mode={{ kind: 'review' }} />;
}
