const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function parseFiles({ sstFile, ohcFile, anchorDate, model_type  }) {
  const formData = new FormData();
  formData.append('sst_file', sstFile);
  if (ohcFile) formData.append('ohc_file', ohcFile);
  if (anchorDate) formData.append('anchor_date', dayjs(anchorDate).format('YYYY-MM'));
  formData.append('model_type', model_type);

  const response = await fetch(`${API_URL}/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to parse files');
  }
  return response.json();
}

export async function getForecast({ sst_pc1, ohc_pc1, model_type }) {
  const response = await fetch(`${API_URL}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sst_pc1, ohc_pc1, model_type }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Forecast failed');
  }
  return response.json();
}