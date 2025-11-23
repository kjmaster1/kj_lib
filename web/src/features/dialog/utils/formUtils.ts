// web/src/features/dialog/utils/formUtils.ts
import dayjs from 'dayjs';

export const prepareFormValues = (rows: any[]) => {
  return rows.map((row) => {
    let value = row.default;

    // Handle Dates
    if (row.type === 'date' || row.type === 'date-range' || row.type === 'time') {
      if (row.default === true) {
        value = new Date().getTime();
      } else if (Array.isArray(row.default)) {
        value = row.default.map((d: string) => new Date(d).getTime());
      } else if (row.default) {
        value = new Date(row.default).getTime();
      }
    }

    // Handle Select Object vs String normalization if needed
    // (Logic moved from original component)

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
