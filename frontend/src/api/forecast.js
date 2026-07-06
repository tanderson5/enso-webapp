export async function parseFiles({ sstFile, ohcFile }) {
  const formData = new FormData();
  formData.append('sst_file', sstFile);
  formData.append('ohc_file', ohcFile);

  const response = await fetch('http://localhost:8000/parse', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to parse files');
  }
  return response.json();
}

export async function getForecast({ sst_pc1, ohc_pc1 }) {
  const response = await fetch('http://localhost:8000/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sst_pc1, ohc_pc1 }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Forecast failed');
  }
  return response.json();
}