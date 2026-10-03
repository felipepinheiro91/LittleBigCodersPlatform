import React, { useId, useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import { materialSource } from "./materialSource.js";

const labels = { video: "vídeo", pdf: "PDF", audio: "áudio", image: "imagem", document: "documento", page: "material" };

export function MaterialViewer({ material }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const playerId = useId();
  const source = materialSource(material.url, material.type);
  if (!source) return <Text color="orange.700" fontSize="sm">O endereço deste material é inválido.</Text>;
  const label = labels[source.kind];
  const frame = source.type === "embed" || ["pdf", "document", "page"].includes(source.kind);
  return <Box w="full" minW="0">
    <Button colorPalette="purple" aria-expanded={open} aria-controls={playerId} onClick={() => { setOpen(current => !current); setFailed(false); }}>{open ? `Recolher ${label}` : `Abrir ${label}`}</Button>
    <Box id={playerId} hidden={!open} mt={open ? "4" : "0"}>
      {open && <Box role="region" aria-label={`${label}: ${material.title}`}>
        {source.type === "sharing" ? <Text color="orange.700">Este é um link de compartilhamento do OneDrive. Para exibir o material aqui, o professor deve cadastrar o endereço gerado em Incorporar → Gerar (o endereço src do iframe). Enquanto isso, abra o original abaixo.</Text> : failed ? <Text role="alert" color="orange.700">Não foi possível carregar o material. Use o link abaixo para abrir o original.</Text> :
          frame ? <iframe src={source.src} title={material.title} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation" onError={() => setFailed(true)} style={{ display: "block", width: "100%", border: 0, borderRadius: 8, ...(source.kind === "video" ? { aspectRatio: "16 / 9" } : { height: "min(70vh, 640px)", minHeight: 360 }) }} /> :
          source.kind === "video" ? <video src={source.src} aria-label={material.title} controls playsInline preload="metadata" onError={() => setFailed(true)} style={{ width: "100%", maxHeight: "70vh" }} /> :
          source.kind === "audio" ? <audio src={source.src} aria-label={material.title} controls preload="metadata" onError={() => setFailed(true)} style={{ width: "100%" }} /> :
          <img src={source.src} alt={material.title} onError={() => setFailed(true)} style={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }} />}
        {frame && source.type !== "sharing" && <Text fontSize="sm" color="gray.600" mt="3">{source.provider === "onedrive" ? "Se o OneDrive bloquear a visualização, confira as permissões do arquivo e gere novamente o endereço em Incorporar. Contas corporativas podem exigir login Microsoft. Você também pode abrir o original abaixo." : "Se a visualização não carregar, abra o original. Alguns serviços exigem acesso ou bloqueiam a incorporação."}</Text>}
        <Box mt="3"><a className="resource-link" href={material.url} target="_blank" rel="noopener noreferrer">Abrir original ↗</a></Box>
      </Box>}
    </Box>
  </Box>;
}
