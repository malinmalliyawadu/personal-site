import React from "react";

const Footer = () => {
  return (
    <footer>
      <span className="footer-link-sep" role="presentation">
        {"{ "}
      </span>
      <a
        href="https://www.linkedin.com/in/malin-malliya-wadu-94956522/"
        rel="noopener noreferrer"
        target="_blank"
      >
        LinkedIn
      </a>
      <span className="footer-link-sep" role="presentation">
        {" } { "}
      </span>
      <a
        href="mailto:malin.malliya.wadu@gmail.com"
        rel="noopener noreferrer"
        target="_blank"
      >
        Email
      </a>
      <span className="footer-link-sep" role="presentation">
        {" } { "}
      </span>
      <a href="/pdfs/resume.pdf" rel="noopener noreferrer" target="_blank">
        Resume
      </a>
      <span className="footer-link-sep" role="presentation">
        {" } { "}
      </span>
      <a
        href="https://github.com/malinmalliyawadu"
        rel="noopener noreferrer"
        target="_blank"
      >
        GitHub
      </a>
      <span className="footer-link-sep" role="presentation">
        {" }"}
      </span>
    </footer>
  );
};

export default Footer;
