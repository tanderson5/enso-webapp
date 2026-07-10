import { useState } from 'react';
import { Stack, Text, Group, Button, Alert, List } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconInfoCircle, IconUpload, IconFile, IconX } from '@tabler/icons-react';
import { DataPreview } from './DataPreview';
import { parseFiles } from '../api/forecast';
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

export function FileUpload({ onChange }) {
  const [sstFile, setSstFile] = useState(null);
  const [ohcFile, setOhcFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleSstChange(file) {
    setSstFile(file);
    setParsedData(null);  // clear preview if files change
    onChange(null);
  }

  function handleOhcChange(file) {
    setOhcFile(file);
    setParsedData(null);
    onChange(null);
  }

  async function handleParse() {
    setLoading(true);
    setError(null);
    setParsedData(null);
    onChange(null);
    try {
      const result = await parseFiles({ sstFile, ohcFile });
      setParsedData(result);
      onChange(result); 
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="lg">
      <Alert icon={<IconInfoCircle size={16} />} color="polyPurple.8">
        <Text size="sm" fw={600} mb={6}>File requirements</Text>
        <List size="sm" spacing={4}>
          <List.Item>At least 18 rows of non-null data</List.Item>
          <List.Item>CSV files must have a header row with PC columns such as <strong>PC1, PC2, ...</strong></List.Item>
          <List.Item>TXT files must have a time column followed by PC columns</List.Item>
        </List>
      </Alert>
      <FileDropzone label="SST File" file={sstFile} onChange={handleSstChange} />
      <FileDropzone label="OHC File" file={ohcFile} onChange={handleOhcChange} />
      

      <Button
        onClick={handleParse}
        loading={loading}
        disabled={!sstFile || !ohcFile}
        fullWidth
        size="md"
        color="polyPurple"
      >
        Grab Latest 18 Months
      </Button>

      {error && <Text c="red" size="sm">{error}</Text>}
      {parsedData && <DataPreview data={parsedData} />}
    </Stack>
  );
}