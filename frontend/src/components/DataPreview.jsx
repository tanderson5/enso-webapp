import { Table, Text, Paper, Stack, Group, Badge } from '@mantine/core';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',  
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function parseDecimalYear(decYear) {
  const year = Math.floor(decYear);
  const monthIndex = Math.min(Math.round((decYear - year) * 12), 11);
  return { year, monthIndex };
}

function generateFullLabels(startDecYear, count) {
  const { year, monthIndex } = parseDecimalYear(startDecYear);
  const startTotal = year * 12 + monthIndex;
  return Array.from({ length: count }, (_, i) => {
    const abs = startTotal + i;
    const y = Math.floor(abs / 12);
    const m = abs % 12;
    return `${MONTHS[m]} ${y}`;
  });
}

export function DataPreview({ data }) {
  const { sst_pc1, ohc_pc1, times, sst_total_rows, ohc_total_rows, overlap_rows } = data;

  const labels = times ? generateFullLabels(times[0], sst_pc1.length) : null;

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="sm">Latest 18 months non-null PC1 values. <strong>Confirm before running</strong></Text>
          <Stack gap={4} align="flex-end">
            <Badge size="sm">SST: {sst_total_rows} total rows</Badge>
            <Badge size="sm">OHC: {ohc_total_rows} total rows</Badge>
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
                <Table.Td>{labels ? labels[i] : i + 1}</Table.Td>
                <Table.Td>{sst != null ? sst.toFixed(4) : 'N/A'}</Table.Td>
                <Table.Td>{ohc_pc1[i] != null ? ohc_pc1[i].toFixed(4) : 'N/A'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Paper>
  );
}