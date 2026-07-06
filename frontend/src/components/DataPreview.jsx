import { Table, Text, Paper, Stack, Group, Badge } from '@mantine/core';

export function DataPreview({ data }) {
  const { sst_pc1, ohc_pc1, sst_total_rows, ohc_total_rows, overlap_rows } = data;

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="sm">Latest 18 months non-null PC1 values. <strong>Confirm before running</strong></Text>
          <Stack gap={4} align="flex-end">
            <Badge size="sm">SST: {sst_total_rows} total rows</Badge>
            <Badge size="sm">OHC: {ohc_total_rows} total rows</Badge>
            {overlap_rows && (
              <Badge color="blue" size="sm">{overlap_rows} overlapping</Badge>
            )}
          </Stack>
        </Group>

        <Table size="sm" withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Month</Table.Th>
              <Table.Th>SST PC1</Table.Th>
              <Table.Th>OHC PC1</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sst_pc1.map((sst, i) => (
              <Table.Tr key={i}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>{sst != null ? sst.toFixed(4) : '—'}</Table.Td>
                <Table.Td>{ohc_pc1[i] != null ? ohc_pc1[i].toFixed(4) : '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Paper>
  );
}