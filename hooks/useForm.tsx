// hooks/useForm.ts
import { useState, useCallback } from 'react';

// Custom hook for form management
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field change
  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error if exists
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validate = useCallback((validationRules: Record<string, (value: any) => string | null>) => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(validationRules).forEach(([field, rule]) => {
      const value = formData[field];
      const error = rule(value);
      
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<any>,
    validationRules: Record<string, (value: any) => string | null> = {}
  ) => {
    if (!validate(validationRules)) {
      return false;
    }
    
    try {
      setIsSubmitting(true);
      const result = await onSubmit(formData);
      return result;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate]);

  // Reset form to initial values
  const resetForm = useCallback((newValues?: T) => {
    setFormData(newValues || initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    validate,
    resetForm,
    setFormData,
    setErrors
  };
}