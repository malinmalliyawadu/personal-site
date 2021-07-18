import React from "react";
import styled from "styled-components";

const LinkSepStart = ({ direction }) => (
  <span className="footer-link-sep" role="presentation">
    {direction === "start" ? "{" : "}"}
  </span>
);

const FooterLinkContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FooterLink = ({ children }) => (
  <FooterLinkContainer>
    <LinkSepStart direction="start" />
    {children}
    <LinkSepStart direction="end" />
  </FooterLinkContainer>
);

const StyledFooter = styled.footer`
  display: flex;
  gap: 0.4rem 0.8rem;
  flex-wrap: wrap;
`;

const Footer = () => {
  return (
    <StyledFooter>
      <FooterLink>
        <a
          href="https://www.linkedin.com/in/malin-malliya-wadu-94956522/"
          rel="noopener noreferrer"
          target="_blank"
        >
          LinkedIn
        </a>
      </FooterLink>
      <FooterLink>
        <a
          href="mailto:malin.malliya.wadu@gmail.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Email
        </a>
      </FooterLink>
      <FooterLink>
        <a href="/pdfs/resume.pdf" rel="noopener noreferrer" target="_blank">
          Resume
        </a>
      </FooterLink>
      <FooterLink>
        <a
          href="https://github.com/malinmalliyawadu"
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </FooterLink>
    </StyledFooter>
  );
};

export default Footer;
