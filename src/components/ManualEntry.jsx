import { useState } from 'react';
import { Stack, Textarea, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

function parseVals(str) {
  return str.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
}

export function ManualEntry({ onChange }) {
  const [sst, setSst] = useState('');
  const [ohc, setOhc] = useState('');
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    const newSst = field === 'sst' ? value : sst;
    const newOhc = field === 'ohc' ? value : ohc;
    if (field === 'sst') setSst(value);
    if (field === 'ohc') setOhc(value);

    if (!newSst && !newOhc) { onChange(null); setError(null); return; }

    const sstVals = parseVals(newSst);
    const ohcVals = parseVals(newOhc);

    if (sstVals.length === 18 && ohcVals.length === 18) {
      setError(null);
      onChange({ sst_pc1: sstVals, ohc_pc1: ohcVals });
    } else {
      setError(`Need exactly 18 values each — SST: ${sstVals.length}/18, OHC: ${ohcVals.length}/18`);
      onChange(null);
    }
  }

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="polyPurple.7">
        Paste or enter 18 comma-separated monthly values for each predictor<br />(oldest → most recent).
      </Alert>
      <Textarea
        label="SST PC1 values"
        description="18 monthly values, comma-separated"
        placeholder="-0.42, 0.13, 0.87, ..."
        autosize
        minRows={2}
        value={sst}
        onChange={(e) => handleChange('sst', e.target.value)}
      />
      <Textarea
        label="OHC PC1 values"
        description="18 monthly values, comma-separated"
        placeholder="-0.31, 0.05, 0.72, ..."
        autosize
        minRows={2}
        value={ohc}
        onChange={(e) => handleChange('ohc', e.target.value)}
      />
      {error && <Text size="sm" c="red">{error}</Text>}
    </Stack>
  );
}