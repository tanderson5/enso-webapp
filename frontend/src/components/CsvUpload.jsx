import { useState } from 'react';
import { Group, Stack, Text, Paper, Table, Alert, Anchor } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconUpload, IconFile, IconX, IconInfoCircle } from '@tabler/icons-react';
import '@mantine/dropzone/styles.css';
import Papa from 'papaparse';

export function CsvUpload({ onChange }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [filename, setFilename] = useState(null);


  function handleDrop(files) {
    setExpanded(false);
    setFilename(files[0].name);
    Papa.parse(files[0], {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: ({ data: rows }) => {
        const allSst = rows.map((r) => r.sst_pc1).filter((v) => v != null);
        const allOhc = rows.map((r) => r.ohc_pc1).filter((v) => v != null);

        if (allSst.length < 18 || allOhc.length < 18) {
          setError(`Expected at least 18 rows with columns: sst_pc1, ohc_pc1. Got ${rows.length} rows, ${Object.keys(rows[0]).length} columns`);
          setPreview(null);
          onChange(null);
          return;
        }

        const sst = allSst.slice(-18);
        const ohc = allOhc.slice(-18);

        setError(null);
        setPreview(rows.slice(-18));
        onChange({ sst_pc1: sst, ohc_pc1: ohc });
      },
      error: () => {
        setError('Failed to parse CSV.');
        onChange(null);
      },
    });
  }

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="polyPurple.8">
        CSV must have a header row with PC columns such as <strong>PC1, PC2, ...</strong> 
        <br></br>Expecting at least 18 rows of data (18 months).
      </Alert>

      <Dropzone onDrop={handleDrop} accept={[MIME_TYPES.csv]} maxFiles={1}>
        <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept><IconUpload size={36} /></Dropzone.Accept>
          <Dropzone.Reject><IconX size={36} color="red" /></Dropzone.Reject>
          <Dropzone.Idle><IconFile size={36} /></Dropzone.Idle>
          <Stack gap={4} align="center">
            <Text fw={600}>Drop CSV here or click to browse</Text>
            <Text size="sm" c="dimmed">.csv files only</Text>
          </Stack>
        </Group>
      </Dropzone>

      {error && <Text c="red" size="sm">{error}</Text>}

      {preview && (
        <Paper withBorder p="md" radius="sm">
          <Text size="sm" fw={600} mb="xs">{filename} (Only latest 18 months used)</Text>
          <Table size="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>SST PC1</Table.Th>
                <Table.Th>OHC PC1</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(expanded ? preview : preview.slice(0, 5)).map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{row.sst_pc1}</Table.Td>
                  <Table.Td>{row.ohc_pc1}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Caption>
              <Group justify="space-between">
                <Anchor size="xs" onClick={() => setExpanded((e) => !e)}>
                  {expanded ? 'Show less' : `Show all 18 rows`}
                </Anchor>
              </Group>
            </Table.Caption>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}