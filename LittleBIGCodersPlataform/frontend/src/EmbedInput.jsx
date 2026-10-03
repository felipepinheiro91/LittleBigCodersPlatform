import React, { useState } from "react";
import { Box, Button, Text, Textarea } from "@chakra-ui/react";
import { Field } from "./ui";
import { MaterialViewer } from "./MaterialViewer";
import { materialSource } from "./materialSource.js";

export function EmbedInput({ material, onApply }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  function apply() {
    setError("");
    const document = new DOMParser().parseFromString(code, "text/html");
    const frames = document.querySelectorAll("iframe");
    const value = code.trim().startsWith("<") ? (frames.length === 1 ? frames[0].getAttribute("src") : null) : code.trim();
    const source = materialSource(value, material.type);
    if (!source) { setError("Cole um código com um único iframe e um endereço HTTP ou HTTPS válido, ou somente o endereço de incorporação."); return; }
    if (source.type === "sharing") { setError("Este endereço ainda é um link de compartilhamento. No OneDrive, use Incorporar → Gerar e copie o código completo do iframe."); return; }
    onApply(new URL(value).href);
    setPreview(true);
  }
  return <Box>
    <Field label="Incorporar material (opcional)"><Textarea value={code} onChange={event => { setCode(event.target.value); setError(""); setPreview(false); }} placeholder={'Cole aqui o código <iframe src="https://..."></iframe> gerado pelo OneDrive'} minH="110px" /></Field>
    <Text fontSize="sm" color="gray.600" mt="2">No OneDrive, selecione o arquivo → Incorporar → Gerar. Copie o código completo. Ao aplicar, o endereço extraído substituirá a URL do recurso.</Text>
    <Button type="button" variant="outline" colorPalette="purple" mt="3" disabled={!code.trim()} onClick={apply}>Aplicar incorporação</Button>
    {error && <Text role="alert" color="red.700" mt="2">{error}</Text>}
    {preview && <Box mt="3"><Text role="status" color="green.700" mb="2">Endereço aplicado. Confira a visualização e salve o material.</Text><MaterialViewer key={`${material.url}:${material.type}`} material={material} /></Box>}
  </Box>;
}
