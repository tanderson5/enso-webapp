import './App.css';
import { useState, useEffect } from 'react';

const items = [
  "The model will look at PC1 of sea surface temperatures (SST from the past 18 months", 
  "The model will look at PC1 of ocean heat content (OHC) from the past 18 months", 
  "The model will take these two predictors and use them to make a forecast to predict whether we are heading into an El Niño or La Niña event"
];

const listObjects = items.map((item, i) => ({
  id: i,
  title: item,
}));

function Header() {
  return (
    <header>
      <h1>ENSO Forecast Prediction</h1>
    </header>
  );
}

function Main(props) {
  return (
    <section>
      <ul className="centered-list">
        {props.dishes.map((dish) => (
          <li key={dish.id}>{dish.title}</li>
        ))}
      </ul>
    </section>
  );
}

function Footer(props) {
  return (
    <footer>
      <p>Trent Anderson | Florida Polytechnic University © {props.year}</p>
    </footer>
  );
}

function App() {
  return (
    <div className="App">
      <Header />
      <Main dishes={listObjects} />
      <Footer year={new Date().getFullYear()} />
    </div>
  );
}

export default App;
