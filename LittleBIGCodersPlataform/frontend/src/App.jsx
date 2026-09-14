import React, { useEffect, useState } from "react";
import { Badge, Box, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createApi } from "./api";
import { ApiContext, Field } from "./ui";
import { Home, Books, Book, Classes, Achievements, Attempts } from "./pages";
import { Performance } from "./performance";
import { Sequences } from "./sequences";
import { Quiz } from "./quiz";
import { AdminOverview, AdminPanel } from "./admin";

function Logo() {
  return <Flex align="center" gap="2"><Box className="logo-mark">&lt;/&gt;</Box><Text fontWeight="800" fontSize="xl">Little<span className="accent">BIG</span> Coders</Text></Flex>;
}
function Login({ api, onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try { onLogin(await api.signIn(login.trim(), password)); }
    catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  }
  return <Flex minH="100vh" className="login-page" align="center" justify="center" p="5"><SimpleGrid columns={{ base: 1, lg: 2 }} maxW="1080px" w="full" bg="white" borderRadius="32px" overflow="hidden" boxShadow="0 28px 80px #33208025"><Stack p={{ base: "8", md: "12" }} gap="7"><Logo /><Heading size="2xl">Sua jornada no mundo da tecnologia começa aqui.</Heading><Text>Entre com as credenciais cadastradas pela sua escola.</Text><Box as="form" onSubmit={submit}><Stack gap="4"><Field label="Login" autoComplete="username" required value={login} onChange={event => setLogin(event.target.value)} /><Field label="Senha" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />{error && <Text role="alert" color="red.700">{error}</Text>}<Button type="submit" colorPalette="purple" loading={loading}>Entrar na plataforma</Button></Stack></Box></Stack><Stack className="login-illustration" p="10" justify="space-between" minH="620px" display={{ base: "none", lg: "flex" }}><Badge alignSelf="start" colorPalette="yellow" variant="solid">APRENDER É UMA AVENTURA</Badge><Box className="rocket" fontSize="90px"><Box className="orbit orbit-one" /><Box className="orbit orbit-two" />🚀</Box><Box><Heading size="2xl">Explore, crie e conquiste</Heading><Text mt="2" opacity=".85">Materiais, desafios e conquistas para cada etapa da sua aprendizagem.</Text></Box></Stack></SimpleGrid></Flex>;
}
function Platform({ user, onLogout }) {
  const [route, setRoute] = useState({ page: user.role === "admin" ? "admin" : "home" });
  const navigate = (page, params = {}) => setRoute({ page, ...params });
  const student = user.role === "student";
  const navigation = user.role === "admin" ? [["admin", "⚙️", "Cadastros"], ["home", "📊", "Visão geral"], ["books", "📚", "Livros"]] : [["home", "🏠", "Início"], ["books", "📚", "Meus livros"], ...(student ? [["achievements", "🏅", "Conquistas"], ["attempts", "🧩", "Minhas provas"]] : [["classes", "👥", "Turmas"], ["performance", "📊", "Desempenho"]])];
  let content;
  switch (route.page) {
    case "admin": content = <AdminPanel />; break;
    case "books": content = <Books navigate={navigate} />; break;
    case "book": content = <Book user={user} book={route.book} navigate={navigate} />; break;
    case "classes": content = <Classes navigate={navigate} />; break;
    case "performance": content = <Performance initialClass={route.classId} />; break;
    case "sequences": content = <Sequences user={user} chapter={route.chapter} book={route.book} navigate={navigate} />; break;
    case "quiz": content = <Quiz user={user} quizId={route.quizId} onBack={() => route.book ? navigate("book", { book: route.book }) : navigate("attempts")} />; break;
    case "achievements": content = <Achievements />; break;
    case "attempts": content = <Attempts navigate={navigate} />; break;
    default: content = user.role === "admin" ? <AdminOverview navigate={navigate} /> : <Home user={user} navigate={navigate} />;
  }
  return <Flex minH="100vh" bg="#f7f8fc" direction={{ base: "column", md: "row" }}><Box as="aside" className="sidebar" w={{ base: "full", md: "240px" }} flexShrink="0" p="5"><Logo /><Stack as="nav" aria-label="Menu principal" gap="2" mt="8">{navigation.map(([page, icon, label]) => <Button className="sidebar-link" key={page} justifyContent="start" colorPalette="purple" variant={route.page === page ? "solid" : "ghost"} onClick={() => navigate(page)}><span className="sidebar-icon" aria-hidden="true">{icon}</span><span>{label}</span></Button>)}<Button className="sidebar-link" mt="4" variant="outline" onClick={onLogout}><span className="sidebar-icon" aria-hidden="true">🚪</span><span>Sair</span></Button></Stack></Box><Box flex="1" minW="0"><Flex className="topbar" px="7" py="4" align="center" justify="space-between" gap="3" wrap="wrap"><Box><Text fontWeight="800">{user.name || user.login}</Text><Text fontSize="sm">{student ? "Estudante" : user.role === "teacher" ? "Professor" : "Administrador"}</Text></Box><Text fontSize="sm">🏫 {user.school?.name ?? "Sem escola vinculada"}</Text></Flex><Stack as="main" p={{ base: "4", lg: "8" }} gap="6" maxW="1500px" mx="auto" key={`${route.page}-${route.book?.id ?? ""}-${route.chapter?.id ?? ""}-${route.quizId ?? ""}`}>{content}</Stack></Box></Flex>;
}
export default function App() {
  const [user, setUser] = useState(null);
  const [api] = useState(() => createApi({ onExpired: () => setUser(null) }));
  const [restoring, setRestoring] = useState(api.hasSession());
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!api.hasSession()) { setRestoring(false); return; }
    let active = true;
    setRestoring(true); setError("");
    api.request("me/").then(profile => { if (active) setUser(profile); }).catch(reason => { if (active && reason.name !== "AbortError") setError(reason.message); }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, [api, revision]);
  if (restoring) return <Text role="status" p="8">Restaurando sua sessão…</Text>;
  if (error && api.hasSession()) return <Stack p="8"><Text role="alert">{error}</Text><Button onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button><Button onClick={() => { api.logout(); setError(""); setUser(null); }}>Voltar ao login</Button></Stack>;
  return <ApiContext.Provider value={api}>{user ? <Platform key={user.id} user={user} onLogout={() => { api.logout(); setUser(null); }} /> : <Login api={api} onLogin={profile => { setError(""); setUser(profile); }} />}</ApiContext.Provider>;
}
