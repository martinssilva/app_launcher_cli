import React from 'react';
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from 'react-hook-form';

import { TextField, type TextFieldProps } from '../TextField';

export interface FormTextFieldProps<T extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
> {
  control: Control<T>;
  name: Path<T>;
}

/** `TextField` bound to react-hook-form: value, blur, focus and error message. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  ...rest
}: FormTextFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      ref={field.ref}
      value={typeof field.value === 'string' ? field.value : ''}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      {...rest}
    />
  );
}
