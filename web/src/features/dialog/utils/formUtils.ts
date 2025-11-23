//
import dayjs from 'dayjs';

export const prepareFormValues = (rows: any[]) => {
  return rows.map((row) => {
    let value = row.default;

    // Handle Dates (Priority over standard defaults)
    if (row.type === 'date' || row.type === 'date-range' || row.type === 'time') {
      if (row.default === true) {
        value = new Date().getTime();
      } else if (Array.isArray(row.default)) {
        value = row.default.map((d: string) => new Date(d).getTime());
      } else if (row.default) {
        value = new Date(row.default).getTime();
      }
    }

    // Fix: Provide default values to prevent uncontrolled inputs if 'default' is missing
    // We check for undefined OR null to be safe, though undefined is the main culprit.
    if (value === undefined || value === null) {
      switch (row.type) {
        case 'checkbox':
          value = false;
          break;
        case 'multi-select':
          value = [];
          break;
        case 'number':
        case 'slider':
          value = row.min ?? 0;
          break;
        default:
          value = ''; // Selects, inputs, textareas, etc.
          break;
      }
    }

    return { value };
  });
};

export const formatSubmissionValues = (formRows: { value: any }[], schemaRows: any[]) => {
  const values: any[] = [];

  formRows.forEach((item, index) => {
    const schema = schemaRows[index];
    let finalValue = item.value;

    // Format Dates back to string if requested
    if ((schema.type === 'date' || schema.type === 'date-range') && schema.returnString) {
      if (finalValue) {
        finalValue = dayjs(finalValue).format(schema.format || 'DD/MM/YYYY');
      }
    }

    values.push(finalValue);
  });

  return values;
};
