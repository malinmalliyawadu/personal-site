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
          <span role="img" aria-label="waving hand">
            👋
          </span>{" "}
          I'm a 🚀delivery-oriented Software Engineer based in Wellington with a
          passion for{" "}
          <div>
            building <span aria-hidden>🤩</span>beautiful,{" "}
            <span aria-hidden>⚡️</span>performant and{" "}
            <span aria-hidden>🕊</span>accessible
          </div>
          web experiences that your customers will love.
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;
