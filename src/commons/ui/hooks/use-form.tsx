import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

// Tipos para los errores de validación
type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

// Función de validación tradicional (mantener compatibilidad)
type ValidationFunction<T> = (values: T) => ValidationErrors<T>;

// Configuración del hook con soporte para Zod
interface UseFormConfig<T> {
  initialValues: T;
  validate?: ValidationFunction<T>;
  schema?: ZodSchema<T>; // Nuevo: soporte para esquemas de Zod
  onSubmit: (values: T) => void | Promise<void>;
}

// Valor de retorno del hook
interface UseFormReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (
    name: keyof T
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (name: keyof T) => () => void;
  handleSubmit: (event: React.FormEvent) => void;
  setFieldValue: (name: keyof T, value: T[keyof T]) => void;
  setFieldError: (name: keyof T, error: string) => void;
  resetForm: () => void;
  validateField: (name: keyof T) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  schema,
  onSubmit,
}: UseFormConfig<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convertir errores de Zod a nuestro formato
  const zodErrorsToValidationErrors = useCallback((zodError: ZodError): ValidationErrors<T> => {
    const validationErrors: ValidationErrors<T> = {};

    zodError.errors.forEach(error => {
      const path = error.path.join('.') as keyof T;
      validationErrors[path] = error.message;
    });

    return validationErrors;
  }, []);

  // Validar usando Zod o función personalizada
  const validateWithSchema = useCallback(
    (valuesToValidate: T): ValidationErrors<T> => {
      if (schema) {
        try {
          schema.parse(valuesToValidate);
          return {};
        } catch (error) {
          if (error instanceof ZodError) {
            return zodErrorsToValidationErrors(error);
          }
          return {};
        }
      } else if (validate) {
        return validate(valuesToValidate);
      }
      return {};
    },
    [schema, validate, zodErrorsToValidationErrors]
  );

  // Validar un campo específico
  const validateField = useCallback(
    (name: keyof T) => {
      const fieldErrors = validateWithSchema(values);
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name] || undefined,
      }));
    },
    [values, validateWithSchema]
  );

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    return validateWithSchema(values);
  }, [values, validateWithSchema]);

  // Verificar si el formulario es válido
  const isValid = Object.keys(errors).length === 0;

  // Manejar cambios en los campos
  const handleChange = useCallback(
    (name: keyof T) => {
      return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { value, type, checked } = event.target as HTMLInputElement;

        const newValue =
          type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value;

        setValues(prev => ({
          ...prev,
          [name]: newValue,
        }));

        // Limpiar error si existe
        if (errors[name]) {
          setErrors(prev => ({
            ...prev,
            [name]: undefined,
          }));
        }
      };
    },
    [errors]
  );

  // Manejar blur (cuando el campo pierde el foco)
  const handleBlur = useCallback(
    (name: keyof T) => {
      return () => {
        setTouched(prev => ({
          ...prev,
          [name]: true,
        }));
        validateField(name);
      };
    },
    [validateField]
  );

  // Establecer valor de un campo manualmente
  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Establecer error de un campo manualmente
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  // Resetear el formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      // Validar todo el formulario
      const formErrors = validateForm();
      setErrors(formErrors);

      // Marcar todos los campos como tocados
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as { [K in keyof T]: boolean });
      setTouched(allTouched);

      // Si hay errores, no enviar
      if (Object.keys(formErrors).length > 0) {
        return;
      }

      // Enviar formulario
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateField,
  };
}
