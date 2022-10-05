import { SessionProvider, signOut } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import { Button, Container, Nav, Navbar } from "react-bootstrap";

const Root = ({ Component, pageProps }: AppProps) => {
  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar variant="dark" expand="lg" style={{ background: "#372649" }}>
        <Container>
          <Navbar.Brand href="/">
            <picture>
              <source srcSet="/logo.svg" type="image/svg+xml" />
              <img
                src="/logo.svg"
                width="30"
                height="30"
                className="d-inline-block align-top"
                alt="App logo"
                style={{ marginRight: "0.5em" }}
              />
            </picture>
            Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/event">Veranstaltungen</Nav.Link>
              <Nav.Link href="/profile">Profil</Nav.Link>
              <Nav.Link href="https://www.study-campus.de/legal.html">
                Impressum
              </Nav.Link>
            </Nav>
            <Button onClick={() => signOut()} variant="outline-light">
              Abmelden
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default Root;
