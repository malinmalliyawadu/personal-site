import profilePic from "./images/profile.jpg";
import resume from "./pdfs/resume.pdf";

function App() {
  return (
    <div className="min-h-screen text-white max-w-screen-lg mx-auto flex flex-col justify-center p-6">
      <div className="flex md:gap-20 flex-col md:flex-row-reverse items-center mb-10 md:mb-20">
        <img
          src={profilePic}
          className="rounded-full max w-52 h-52 border-4 shadow-2xl border-gray-100 border-opacity-40 drop-shadow-2xl mb-10"
          alt="Photo of me"
        />

        <div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            Hi, I'm Malin!&nbsp;👋
          </h1>
          <p className="text-2xl text-white text-opacity-90">
            A full-stack developer based in Wellington, NZ with a passion for
            building 🤩&nbsp;beautiful, ⚡️&nbsp;performant and&nbsp;🕊
            accessible web experiences that your customers will love.
          </p>
        </div>
      </div>

      <div>
        <ul className="flex gap-6 items-end">
          <li className="text-8xl hidden md:block">{"{"}</li>
          <li>
            <a
              href="https://github.com/malinmalliyawadu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center transform transition-all hover:scale-125 hover:text-yellow-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className=""
                width="44"
                height="44"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentcolor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
              </svg>
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/malin-malliya-wadu-94956522/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center transform transition-all hover:scale-125 hover:text-yellow-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="44"
                height="44"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentcolor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="8" y1="11" x2="8" y2="16" />
                <line x1="8" y1="8" x2="8" y2="8.01" />
                <line x1="12" y1="16" x2="12" y2="11" />
                <path d="M16 16v-3a2 2 0 0 0 -4 0" />
              </svg>
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href={resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center transform transition-all hover:scale-125 hover:text-yellow-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="44"
                height="44"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentcolor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M5 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5" />
                <circle cx="6" cy="14" r="3" />
                <path d="M4.5 17l-1.5 5l3 -1.5l3 1.5l-1.5 -5" />
              </svg>
              Resume
            </a>
          </li>
          <li className="flex justify-center">
            <a
              className="flex flex-col items-center transform transition-all hover:scale-125 hover:text-yellow-300"
              href="mailto:malin.malliya.wadu@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="44"
                height="44"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentcolor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <polyline points="3 7 12 13 21 7" />
              </svg>
              Email
            </a>
          </li>
          <li className="text-8xl hidden md:block">{"}"}</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
