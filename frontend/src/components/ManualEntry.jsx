import { useState, useEffect } from 'react';
import { Stack, Textarea, Text, Alert } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { IconInfoCircle } from '@tabler/icons-react';
import '@mantine/dates/styles.css';

function parseVals(str) {
  return str
    .trim()
    .split(/[\s,]+/) 
    .map((v) => parseFloat(v.trim()))
    .filter((v) => !isNaN(v));
}

import dayjs from 'dayjs';

function dateToDecimalYear(date) {
  if (!date) return null;
  const year = dayjs(date).year();
  const month = dayjs(date).month(); 
  return year + (month) / 12;
}

export function ManualEntry({ onChange }) {
  const [sst, setSst] = useState('');
  const [ohc, setOhc] = useState('');
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sstVals = parseVals(sst);
    const ohcVals = parseVals(ohc);

    if (!sst && !ohc) {
      onChange(null);
      setError(null);
      return;
    }

    if (sstVals.length == 18 && ohcVals.length == 18) {
      const sst18 = sstVals.slice(-18);
      const ohc18 = ohcVals.slice(-18);

      let times = null;
      if (endDate) {
        const endDecimal = dateToDecimalYear(endDate);
        const endMonthAbs = Math.floor(endDecimal) * 12 + Math.round((endDecimal - Math.floor(endDecimal)) * 12);
        times = Array.from({ length: 18 }, (_, i) => {
          const absMonth = endMonthAbs - (17 - i);
          return Math.floor(absMonth / 12) + (absMonth % 12) / 12;
        });
      }

      setError(null);
      onChange({ sst_pc1: sst18, ohc_pc1: ohc18, times });
    } else {
      setError(`Need exactly 18 values each. SST: ${sstVals.length}/18, OHC: ${ohcVals.length}/18`);
      onChange(null);
    }
  }, [sst, ohc, endDate]);

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="polyPurple.8">
        Paste or enter 18 comma-separated monthly values for each predictor<br />(oldest → most recent).
      </Alert>
      <Textarea
        label="SST PC1 values"
        description="Exactly 18 monthly values, comma-separated"
        placeholder="-0.42, 0.13, 0.87, ..."
        autosize
        minRows={2}
        value={sst}
        onChange={(e) => setSst(e.target.value)}
      />
      <Textarea
        label="OHC PC1 values"
        description="Exactly 18 monthly values, comma-separated"
        placeholder="-0.31, 0.05, 0.72, ..."
        autosize
        minRows={2}
        value={ohc}
        onChange={(e) => setOhc(e.target.value)}
      />
      <MonthPickerInput
        label="Last month of input data"
        description="Select the month and year of your most recent data point, if available"
        placeholder="e.g. June 2021"
        value={endDate}
        onChange={setEndDate}
        maxDate={new Date()}
        clearable
      />
      {error && <Text size="sm" c="red">{error}</Text>}
    </Stack>
  );
}