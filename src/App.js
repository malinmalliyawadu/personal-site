import React from "react";
import "./App.css";
import Footer from "./components/Footer";

const App = () => {
  return (
    <div className="App">
      <header>
        <span className="anim-type">@malin</span>
        <span className="cursor--blink">_</span>
      </header>
      <main>
        <section className="bio">
          Hi!
          <span role="img" aria-label="Waving hand">
            👋
          </span>{" "}
          I'm a delivery-oriented software engineer currently based in
          Wellington with a passion for building beautiful, performant and
          accessible products that your customers will love.
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;
