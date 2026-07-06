import { MantineProvider, createTheme, Container, Title, Text, Stack, Paper, SegmentedControl, Button, Image } from '@mantine/core';
import '@mantine/core/styles.css';
import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ManualEntry } from './components/ManualEntry';
import { getForecast } from './api/forecast';
import ExampleForecast from './assets/ExampleForecast.png';



const colorMap = { 'El Niño': 'red', 'La Niña': 'blue', 'Neutral': 'gray' };

function Footer({ year }) {
  return (
    <Container size="md" py="xl">
      <Text ta="center" c="dimmed" size="sm">
        Trent Anderson | Florida Polytechnic University © {year}
      </Text>
    </Container>
  );
}

function App() {
  const [mode, setMode] = useState('upload');
  const [data, setData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      setResult(await getForecast(data));
    } catch {
      setError('Forecast failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(val) {
    setMode(val);
    setData(null);
    setResult(null);
  }

  return (
    <MantineProvider>
      <Container size="sm" py="xl">
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <Title order={1}>ENSO Forecast Prediction</Title>
            <Text c="dimmed" size="sm">Upload data files or enter values manually</Text>
          </Stack>

          <Paper withBorder p="xl" radius="md">
            <Stack gap="lg">
              <SegmentedControl
                color="polyPurple"
                fullWidth
                value={mode}
                onChange={handleModeChange}
                data={[
                  { label: 'Upload files', value: 'upload' },
                  { label: 'Enter Manually', value: 'manual' },
                ]}
              />

              {mode === 'upload' ? <FileUpload onChange={setData} /> : <ManualEntry onChange={setData} />}

              <Button onClick={handleSubmit} color="polyPurple" loading={loading} disabled={!data} fullWidth size="md">
                Run Forecast
              </Button>

              {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
          </Paper>

          {result && (
            <Paper withBorder radius="md" overflow="hidden">
              <Stack gap={0}>
                <Image
                  src={ExampleForecast}
                  alt="Forecast output"
                  radius="md"
                />
                <Stack align="center" gap="xs" p="lg">
                  <Text size="sm" c="dimmed" fw={500}>Forecast Result</Text>
                  <Text size="xl" fw={800} c={colorMap[result.prediction]}>
                    {result.prediction}
                  </Text>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Footer year={new Date().getFullYear()} />

        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;