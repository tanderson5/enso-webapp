import { useState } from 'react';
import { Stack, Text, Group, Button, Alert, List, Code } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconInfoCircle, IconUpload, IconFile, IconX } from '@tabler/icons-react';
import { DataPreview } from './DataPreview';
import { parseFiles } from '../api/forecast';
import { MonthPickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import dayjs from 'dayjs';
import '@mantine/dropzone/styles.css';

const ACCEPTED = [MIME_TYPES.csv, 'text/plain'];

function FileDropzone({ label, file, onChange }) {
  return (
    <Stack gap="md">
      <Text fw={600} size="sm">{label}</Text>
      <Dropzone onDrop={(files) => onChange(files[0])} accept={ACCEPTED} maxFiles={1}>
        <Group justify="center" gap="md" mih={100} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept><IconUpload size={36} /></Dropzone.Accept>
          <Dropzone.Reject><IconX size={36} color="red" /></Dropzone.Reject>
          <Dropzone.Idle><IconFile size={36} /></Dropzone.Idle>
          <Stack gap={4} align="center">
            <Text size="sm" fw={600}>
              {file ? file.name : 'Drop file or click to browse'}
            </Text>
            <Text size="xs" c="dimmed">.csv or .txt</Text>
          </Stack>
        </Group>
      </Dropzone>
    </Stack>
  );
}

export function FileUpload({ onChange, model_type }) {
  const [sstFile, setSstFile] = useState(null);
  const [ohcFile, setOhcFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [anchorDate, setAnchorDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canParse = sstFile && (model_type === 'sst_only' || ohcFile);
  const hasTimesFromFile = parsedData?.times != null;

  function buildTimesFromDate(date, length = 18) {
    const year = dayjs(date).year();
    const month = dayjs(date).month(); // 0-indexed
    const endMonthAbs = year * 12 + month;
    return Array.from({ length }, (_, i) => {
      const abs = endMonthAbs - (length - 1 - i);
      return Math.floor(abs / 12) + (abs % 12) / 12;
    });
  }

  function handleFileChange(setter) {
    return (file) => {
      setter(file);
      setParsedData(null);
      setAnchorDate(null);
      onChange(null);
    };
  }

  async function handleParse() {
    setLoading(true);
    setError(null);
    setParsedData(null);
    setAnchorDate(null);
    onChange(null);
    try {
      const result = await parseFiles({ sstFile, ohcFile, model_type });
      setParsedData(result);
      onChange(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAnchorDateChange(date) {
    setAnchorDate(date);
    if (!parsedData) return;
    if (date) {
      const times = buildTimesFromDate(date, parsedData.sst_pc1.length);
      onChange({ ...parsedData, times });
    } else {
      onChange({ ...parsedData, times: null }); 
    }
  }

  return (
    <Stack gap="lg">
      <Alert icon={<IconInfoCircle size={16} />} color="polyPurple.8">
        <Text size="sm" fw={600} mb={6}>File requirements</Text>
        <List size="sm" spacing={4}>
          <List.Item>At least 18 rows of non-null data</List.Item>
          <List.Item>CSV files must have a header row with PC columns (e.g. <Code>PC1</Code>, <Code>PC2</Code>), or be in NOAA OHC format with a <Code>Date</Code> column followed by OHC value</List.Item>
          <List.Item>TXT files must have a time column followed by PC columns, or be in NOAA SST format with an <Code>ANOM</Code> column after a <Code>NINO3.4</Code> column</List.Item>
          <List.Item>Do not mix processed PC files with NOAA index files</List.Item>
        </List>
      </Alert>


      <FileDropzone
        label="SST File"
        file={sstFile}
        onChange={handleFileChange(setSstFile)}
      />

      {model_type === 'sst_ohc' && (
        <FileDropzone
          label="OHC File"
          file={ohcFile}
          onChange={handleFileChange(setOhcFile)}
        />
      )}

      <Button
        onClick={handleParse}
        loading={loading}
        disabled={!canParse}
        fullWidth
        size = "md"
        color="polyPurple"
      >
        Grab Latest 18 Months
      </Button>

      {error && <Text c="red" size="sm">{error}</Text>}

      {/* date picker only when file has no time data */}
      {parsedData && !hasTimesFromFile && (
        <MonthPickerInput
          label="Last month of input data"
          description="No date column detected. Please select the most recent month of your data to enable date labels"
          placeholder="e.g. June 2021"
          value={anchorDate}
          onChange={handleAnchorDateChange}
          maxDate={new Date()}
          clearable
        />
      )}

      {parsedData && <DataPreview data={
        // if date selected, show preview with generated times, otherwise null times
        anchorDate
          ? { ...parsedData, times: buildTimesFromDate(anchorDate, parsedData.sst_pc1.length) }
          : parsedData
      } />}
    </Stack>
  );
}