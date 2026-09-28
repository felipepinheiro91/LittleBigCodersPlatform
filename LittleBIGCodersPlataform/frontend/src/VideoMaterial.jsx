import React, { useId, useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import { videoSource } from "./videoSource";

export function VideoMaterial({ material }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = videoSource(material.url);
  const playerId = useId();
  return <Box w="full" minW="0">
    <Button colorPalette="purple" aria-expanded={open} aria-controls={playerId} onClick={() => { setOpen(current => !current); setFailed(false); }}>{open ? "Recolher vídeo" : "▶ Assistir vídeo"}</Button>
    <Box id={playerId} hidden={!open} mt={open ? "4" : "0"}>
      {open && <Box role="region" aria-label={`Vídeo: ${material.title}`}>
            {source && !failed ? <Box bg="black" borderRadius="lg" overflow="hidden" style={{ aspectRatio: "16 / 9" }}>
              {source.type === "embed" ? <iframe src={source.src} title={material.title} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{ width: "100%", height: "100%", border: 0 }} /> : <video src={source.src} aria-label={material.title} controls playsInline preload="metadata" controlsList="nodownload noremoteplayback" disableRemotePlayback onError={() => setFailed(true)} style={{ width: "100%", height: "100%" }} />}
            </Box> : <Text role="alert" color="orange.700">Não foi possível reproduzir este vídeo aqui. Peça ao professor ou administrador para verificar o endereço e a permissão de reprodução incorporada.</Text>}
            {source?.type === "embed" && <Text fontSize="sm" color="gray.600" mt="3">Se o player informar que o vídeo está indisponível, avise o professor para conferir as permissões do vídeo.</Text>}
      </Box>}
    </Box>
  </Box>;
}
