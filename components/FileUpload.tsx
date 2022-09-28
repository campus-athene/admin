import { ChangeEventHandler, useState } from "react";
import { Form } from "react-bootstrap";

const FileUpload = (props: {
  fileName?: string;
  onFileUploaded?: (id: string, file: File) => void;
}) => {
  const onChange: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const file = ev.target.files?.item(0);
    if (!file) return;

    let id: string | null = null;
    try {
      id = (
        await (
          await fetch("/api/upload", {
            body: file,
            headers: {
              "content-type": file.type,
            },
            method: "POST",
          })
        ).json()
      )?.id;
    } catch (error) {
      console.error(error);
    }

    if (!id) {
      alert(
        "Die Datei konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut."
      );
      return;
    }

    props.onFileUploaded && props.onFileUploaded(id, file);
  };

  return (
    <Form.Control
      defaultValue={props.fileName}
      onChange={onChange}
      type="file"
    />
  );
};

export default FileUpload;
