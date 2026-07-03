import { useState } from 'react';
import { Group, Stack, Text, Paper, Table, Alert } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconUpload, IconFile, IconX, IconInfoCircle } from '@tabler/icons-react';
import '@mantine/dropzone/styles.css';
import Papa from 'papaparse';

export function CsvUpload({ onChange }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  function handleDrop(files) {
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
        setPreview(rows.slice(-18, -13));
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
        CSV must have 2 columns: <strong>sst_pc1</strong>, <strong>ohc_pc1</strong>. Expecting at least 18 rows (18 months).
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
          <Text size="sm" fw={600} mb="xs">Preview (Only latest 18 months used)</Text>
          <Table size="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>SST PC1</Table.Th>
                <Table.Th>OHC PC1</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {preview.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{row.sst_pc1}</Table.Td>
                  <Table.Td>{row.ohc_pc1}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Text size="xs" c="dimmed" mt="xs">…and 13 more rows</Text>
        </Paper>
      )}
    </Stack>
  );
}