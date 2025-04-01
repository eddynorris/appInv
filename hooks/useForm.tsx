import { useState, useCallback } from 'react';

/**
 * Custom hook for form management with validation
 * 
 * @param initialValues Initial form values
 * @returns Form management utilities
 */
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Handle field change and clear error
   */
  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
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

  /**
   * Validate form against provided rules
   */
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

  /**
   * Handle form submission with validation
   */
  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<any>,
    validationRules: Record<string, (value: any) => string | null> = {}
  ) => {
    // Mark all fields as touched on submit
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(allTouched);
    
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

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback((newValues?: T) => {
    setFormData(newValues || initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set multiple field values at once
   */
  const setValues = useCallback((values: Partial<T>) => {
    setFormData(prev => ({
      ...prev,
      ...values
    }));
  }, []);

  /**
   * Check if a field has been touched
   */
  const isTouched = useCallback((field: keyof T) => {
    return touched[field as string] || false;
  }, [touched]);

  /**
   * Check if a field has an error
   */
  const hasError = useCallback((field: keyof T) => {
    return !!errors[field as string];
  }, [errors]);

  /**
   * Get the error message for a field
   */
  const getError = useCallback((field: keyof T) => {
    return errors[field as string] || '';
  }, [errors]);

  return {
    formData,
    errors,
    isSubmitting,
    touched,
    handleChange,
    handleSubmit,
    validate,
    resetForm,
    setFormData,
    setErrors,
    setValues,
    isTouched,
    hasError,
    getError
  };
}