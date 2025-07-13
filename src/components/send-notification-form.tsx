
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/ai/flows/send-notification';

interface SendNotificationFormValues {
  message: string;
}

interface SendNotificationFormProps {
  onNotificationSent?: () => void;
}

export function SendNotificationForm({ onNotificationSent }: SendNotificationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SendNotificationFormValues>({
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: SendNotificationFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await sendNotification(data.message);
      if (result.success) {
        toast({
          title: 'Notification Sent',
          description: 'Your broadcast message has been sent successfully.',
        });
        reset();
        onNotificationSent?.();
      } else {
        throw new Error(result.message || 'Failed to send notification.');
      }
    } catch (error) {
      console.error('Error sending notification: ', error);
      toast({
        variant: 'destructive',
        title: 'Sending Error',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 pt-4">
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Type your notification here. e.g., 'Bus Route 2 will be delayed by 15 minutes.'"
          {...register('message', {
            required: 'Message is required.',
            minLength: { value: 10, message: 'Message must be at least 10 characters long.' },
            maxLength: { value: 200, message: 'Message cannot exceed 200 characters.' },
          })}
          className="min-h-[120px]"
        />
        {errors.message && <p className="text-destructive text-sm">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Notification'}
      </Button>
    </form>
  );
}
