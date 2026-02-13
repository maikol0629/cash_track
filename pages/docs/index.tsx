import dynamic from 'next/dynamic';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className='min-h-screen bg-white'>
      <SwaggerUI url='/api/docs' />
    </div>
  );
}
