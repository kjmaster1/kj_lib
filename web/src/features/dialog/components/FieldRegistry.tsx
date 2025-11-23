// web/src/features/dialog/components/FieldRegistry.tsx
import React from 'react';
import InputField from './fields/input';
import CheckboxField from './fields/checkbox';
import SelectField from './fields/select';
import NumberField from './fields/number';
import SliderField from './fields/slider';
import ColorField from './fields/color';
import DateField from './fields/date';
import TextareaField from './fields/textarea';
import TimeField from './fields/time';

// Define a type map for your components
// This allows us to map the string 'input' to the InputField component
export const FIELD_REGISTRY: Record<string, React.FC<any>> = {
  input: InputField,
  password: InputField, // Handle password via props in InputField
  checkbox: CheckboxField,
  select: SelectField,
  'multi-select': SelectField,
  number: NumberField,
  slider: SliderField,
  color: ColorField,
  date: DateField,
  'date-range': DateField,
  time: TimeField,
  textarea: TextareaField,
};

export const getFieldComponent = (type: string) => {
  return FIELD_REGISTRY[type] || (() => <div style={{ color: 'red' }}>Unknown Field: {type}</div>);
};
