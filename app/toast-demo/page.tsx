'use client';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ToastDemo() {
  const { success, error, warning, info, addToast, removeToast } = useToast();

  const handleSuccess = () => {
    success('Success!', 'Operation completed successfully');
  };

  const handleError = () => {
    error('Error', 'Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    warning('Warning', 'This action cannot be undone');
  };

  const handleInfo = () => {
    info('Information', 'Here is some useful information for you');
  };

  const handleCustomToast = () => {
    addToast({
      type: 'info',
      title: 'Custom Toast',
      message: 'This toast will stay until you close it',
      duration: 0, // No auto-dismiss
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Toast Notifications Demo</h1>
        
        <div className="grid gap-4">
          <div className="flex gap-2">
            <Button onClick={handleSuccess} variant="success">
              Show Success Toast
            </Button>
            <Button onClick={handleError} variant="danger">
              Show Error Toast
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleWarning} variant="outline">
              Show Warning Toast
            </Button>
            <Button onClick={handleInfo} variant="outline">
              Show Info Toast
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCustomToast} variant="primary">
              Show Custom Toast (No Auto-dismiss)
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">How to use in your components:</h2>
          <pre className="text-sm bg-gray-900 text-white p-3 rounded overflow-x-auto">
{`import { useToast } from '@/hooks/use-toast';

export default function MyComponent() {
  const { success, error } = useToast();

  const handleSubmit = async () => {
    try {
      await api_call();
      success('Success!', 'Data saved successfully');
    } catch (err) {
      error('Error', 'Failed to save data');
    }
  };
}`}
          </pre>
        </div>
      </Card>
    </div>
  );
}
