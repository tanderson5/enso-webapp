import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@mantine/core/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { generateColors } from '@mantine/colors-generator';

const theme = createTheme({
  primaryColor: 'polyPurple',
  colors: {
    polyPurple: generateColors('#501D83'),
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)
