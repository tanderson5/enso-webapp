import { MantineProvider, createTheme, Container, Title, Text, Stack, Paper, SegmentedControl, Button } from '@mantine/core';
import '@mantine/core/styles.css';
import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ManualEntry } from './components/ManualEntry';
import { getForecast } from './api/forecast';
import { ForecastChart } from './components/ForecastChart';


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
  const [model_type, set_model_type] = useState('sst_ohc');

  function handleModelChange(ckpt){
    set_model_type(ckpt);
    setData(null);
    setResult(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      setResult(await getForecast({ ...data, model_type }));;
    } catch(e) {
      console.log('Forecast error:', e.message);
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

  function handleDataChange(newData) {
    setData(newData);
    if (!newData) setResult(null);
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
                fullWidth
                value={model_type}
                onChange={handleModelChange}
                color="polyPurple"
                data={[
                  { label: 'SST + OHC', value: 'sst_ohc' },
                  { label: 'SST Only', value: 'sst_only' },
                ]}
              />

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

              {mode === 'upload'
                ? <FileUpload key={`upload-${model_type}`} onChange={handleDataChange} model_type={model_type} />
                : <ManualEntry key={`manual-${model_type}`} onChange={handleDataChange} model_type={model_type} />
              }

              <Button onClick={handleSubmit} color="polyPurple" loading={loading} disabled={!data} fullWidth size="md">
                Run Forecast
              </Button>

              {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
          </Paper>

          {result && <ForecastChart result={result} historical={data.sst_pc1} times={data.times} />}

          <Footer year={new Date().getFullYear()} />

        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;