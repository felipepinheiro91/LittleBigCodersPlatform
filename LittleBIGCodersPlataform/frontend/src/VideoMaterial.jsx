import React, { useState } from "react";
import { Box, Button, Dialog, Portal, Text } from "@chakra-ui/react";
import { videoSource } from "./videoSource";

export function VideoMaterial({ material }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = videoSource(material.url);
  return <Dialog.Root open={open} onOpenChange={details => { setOpen(details.open); setFailed(false); }} placement="center" size="xl" lazyMount unmountOnExit>
    <Dialog.Trigger asChild><Button colorPalette="purple">▶ Assistir vídeo</Button></Dialog.Trigger>
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner p={{ base: "2", md: "6" }}>
        <Dialog.Content maxW="1000px" maxH="90dvh" overflowY="auto" borderRadius="xl">
          <Dialog.Header pr="24"><Dialog.Title>{material.title}</Dialog.Title></Dialog.Header>
          <Dialog.CloseTrigger asChild position="absolute" top="3" right="3"><Button variant="ghost" size="sm" aria-label="Fechar vídeo">Fechar ×</Button></Dialog.CloseTrigger>
          <Dialog.Body pb="6">
            <Dialog.Description mb="4">Assista ao conteúdo aqui no LittleBigCoders.</Dialog.Description>
            {open && source && !failed ? <Box bg="black" borderRadius="lg" overflow="hidden" style={{ aspectRatio: "16 / 9" }}>
              {source.type === "embed" ? <iframe src={source.src} title={material.title} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{ width: "100%", height: "100%", border: 0 }} /> : <video src={source.src} aria-label={material.title} controls playsInline preload="metadata" controlsList="nodownload noremoteplayback" disableRemotePlayback onError={() => setFailed(true)} style={{ width: "100%", height: "100%" }} />}
            </Box> : <Text role="alert" color="orange.700">Não foi possível reproduzir este vídeo aqui. Peça ao professor ou administrador para verificar o endereço e a permissão de reprodução incorporada.</Text>}
            {source?.type === "embed" && <Text fontSize="sm" color="gray.600" mt="3">Se o player informar que o vídeo está indisponível, avise o professor para conferir as permissões do vídeo.</Text>}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>;
}
