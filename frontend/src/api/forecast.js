export async function getForecast(data) {
  await new Promise((res) => setTimeout(res, 750));
  const outcomes = ['El Niño', 'La Niña', 'Neutral'];
  return {
    prediction: outcomes[Math.floor(Math.random() * outcomes.length)]
  };
}