import React, { useEffect, useId, useRef, useState } from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";

export function MobileNavigation({ logo, user, navigation, activePage, navigate, onLogout }) {
  const dialogRef = useRef(null);
  const dialogId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = () => dialogRef.current?.close();
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onResize = () => { if (desktop.matches) dialogRef.current?.close(); };
    desktop.addEventListener("change", onResize);
    return () => { document.body.style.overflow = previousOverflow; desktop.removeEventListener("change", onResize); };
  }, [open]);
  return <>
    <Flex as="header" className="mobile-header" display={{ base: "flex", md: "none" }} align="center" justify="space-between" gap="3">
      {logo}
      <Button type="button" className="mobile-menu-button" variant="outline" colorPalette="purple" aria-label="Abrir menu principal" aria-expanded={open} aria-controls={dialogId} onClick={() => { dialogRef.current.showModal(); setOpen(true); }}><span aria-hidden="true">☰</span></Button>
    </Flex>
    <dialog ref={dialogRef} id={dialogId} className="mobile-menu-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); } }}>
      <Flex align="center" justify="space-between" gap="3"><Heading id={titleId} size="lg">Menu principal</Heading><Button type="button" autoFocus aria-label="Fechar menu" variant="ghost" onClick={close}>✕</Button></Flex>
      <Box className="mobile-menu-profile"><Text fontWeight="800" overflowWrap="anywhere">{user.name || user.login}</Text><Text fontSize="sm">{user.role === "student" ? "Estudante" : user.role === "teacher" ? "Professor" : "Administrador"}</Text><Text fontSize="sm" mt="2" overflowWrap="anywhere">🏫 {user.school?.name ?? "Sem escola vinculada"}</Text></Box>
      <Stack as="nav" aria-label="Menu principal" gap="2">{navigation.map(([page, icon, label]) => <Button key={page} className="sidebar-link" justifyContent="start" colorPalette="purple" variant={activePage === page ? "solid" : "ghost"} aria-current={activePage === page ? "page" : undefined} onClick={() => { close(); navigate(page); }}><span className="sidebar-icon" aria-hidden="true">{icon}</span>{label}</Button>)}</Stack>
      <Button className="mobile-menu-logout" variant="outline" w="full" onClick={() => { close(); onLogout(); }}>🚪 Sair</Button>
    </dialog>
  </>;
}
