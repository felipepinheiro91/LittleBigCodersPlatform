import React, { useRef, useState } from "react";
import { Box, Button, Input, Text } from "@chakra-ui/react";
import { Field } from "./ui";

export function QuestionImage({ question }) {
  const [failed, setFailed] = useState(false);
  if (!question.image) return null;
  return failed ? <Text role="alert" color="orange.700">Não foi possível carregar a imagem desta questão. Avise o professor.</Text> : <img className="question-image" src={question.image} alt={question.image_description || "Imagem do enunciado"} onError={() => setFailed(true)} />;
}

export function QuestionImageInput({ question, onChange }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const readerRef = useRef(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  function select(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    readerRef.current?.abort();
    setBusy(false); setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Selecione uma imagem JPG, PNG ou WebP de até 2 MB."); return;
    }
    const reader = new FileReader();
    readerRef.current = reader;
    setBusy(true);
    reader.onload = () => { changeRef.current({ image: reader.result }); setBusy(false); };
    reader.onerror = () => { setError("Não foi possível ler a imagem. Tente novamente."); setBusy(false); };
    reader.readAsDataURL(file);
  }
  return <Box>
    <Field label="Imagem da questão (opcional · JPG, PNG ou WebP · até 2 MB)"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={select} /></Field>
    {busy && <Text role="status">Carregando imagem…</Text>}
    {error && <Text role="alert" color="red.700">{error}</Text>}
    {question.image && <><QuestionImage key={question.image} question={question} /><Field label="Descrição da imagem (para leitores de tela)"><Input maxLength={255} value={question.image_description || ""} onChange={event => onChange({ image_description: event.target.value })} /></Field><Button type="button" variant="outline" mt="2" onClick={() => { readerRef.current?.abort(); setBusy(false); onChange({ image: "", image_description: "" }); }}>Remover imagem</Button></>}
  </Box>;
}
