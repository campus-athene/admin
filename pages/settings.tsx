import { NextPage } from "next";
import Head from "next/head";
import { FormEventHandler } from "react";
import { Container } from "react-bootstrap";

const SettingsPage: NextPage = () => {
  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const controls = e.target as unknown as { [id: string]: HTMLInputElement };

    if (controls.newPassword.value !== controls.newPasswordRepeat.value) {
      alert("Die neuen Passwörter stimmen nicht überein!");
      controls.newPassword.focus();
      return;
    }

    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldPassword: controls.oldPassword.value,
        newPassword: controls.newPassword.value,
      }),
    });

    if (res.ok) {
      alert("Das Passwort wurde erfolgreich geändert.");
      controls.oldPassword.value = "";
      controls.newPassword.value = "";
      controls.newPasswordRepeat.value = "";
    } else
      alert(
        res.headers.get("Content-Length")?.match(/^[1-9][0-9]*$/)
          ? (await res.json()).error
          : "Ein unbekannter Fehler ist aufgetreten.",
      );
  };

  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Einstellungen</title>
      </Head>

      <h1 className="mb-4">Einstellungen</h1>
      <h3>Passwort ändern</h3>
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="oldPassword" className="form-label">
            Altes Passwort
          </label>
          <input type="password" className="form-control" id="oldPassword" />
        </div>
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            Neues Passwort
          </label>
          <input type="password" className="form-control" id="newPassword" />
        </div>
        <div className="mb-3">
          <label htmlFor="newPasswordRepeat" className="form-label">
            Neues Passwort wiederholen
          </label>
          <input
            type="password"
            className="form-control"
            id="newPasswordRepeat"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Passwort ändern
        </button>
      </form>
    </Container>
  );
};

export default SettingsPage;
