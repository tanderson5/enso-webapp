import { MantineProvider, Container, Title, List, Text, Stack } from '@mantine/core';
import '@mantine/core/styles.css';

const items = [
  "The model will look at PC1 of sea surface temperatures (SST) from the past 18 months",
  "The model will look at PC1 of ocean heat content (OHC) from the past 18 months",
  "The model will take these two predictors and use them to make a forecast to predict whether we are heading into an El Niño or La Niña event"
];

function Header() {
  return (
    <Container size="md" py="xl">
      <Title order={1} ta="center">
        ENSO Forecast Prediction
      </Title>
    </Container>
  );
}

function Main({ items }) {
  return (
    <Container size="sm">
      <List spacing="md" size="md" center>
        {items.map((item, i) => (
          <List.Item key={i}>{item}</List.Item>
        ))}
      </List>
    </Container>
  );
}

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
  return (
    <MantineProvider>
      <Stack gap={0}>
        <Header />
        <Main items={items} />
        <Footer year={new Date().getFullYear()} />
      </Stack>
    </MantineProvider>
  );
}

export default App;