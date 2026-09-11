import {
  Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Textarea,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { signIn } from "./api";
import { achievementCategories, books, chapters, classes } from "./data";
import { getDemoUser, getSchoolClasses } from "./schoolModel";

const Icon = ({ children }) => <Box as="span" fontSize="lg" lineHeight="1">{children}</Box>;

function Logo({ compact = false }) {
  return <Flex align="center" gap="2"><Box className="logo-mark">&lt;/&gt;</Box><Text display={compact ? { base: "none", md: "block" } : "block"} fontWeight="800" fontSize="xl">Little<span className="accent">BIG</span> Coders</Text></Flex>;
}

function Login({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError("");
    try { onLogin(await signIn(login, password)); }
    catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  }

  return <Flex minH="100vh" className="login-page" align="center" justify="center" p="5">
    <SimpleGrid columns={{ base: 1, lg: 2 }} maxW="1080px" w="full" bg="white" borderRadius="32px" overflow="hidden" boxShadow="0 28px 80px rgba(51, 32, 128, .18)">
      <Stack p={{ base: "8", md: "12" }} gap="7" justify="center">
        <Logo />
        <Box><Heading size="2xl" color="purple.950">Sua jornada no mundo da tecnologia começa aqui.</Heading><Text mt="3" color="gray.600">Entre com os dados da etiqueta do seu livro ou com o acesso de professor.</Text></Box>
        <Box as="form" onSubmit={submit}><Stack gap="4">
          <Box><Text className="field-label">Login</Text><Input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Seu login" size="lg" required /></Box>
          <Box><Text className="field-label">Senha ou código de acesso</Text><Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" size="lg" required /></Box>
          {error && <Text color="red.600" fontSize="sm">{error}</Text>}
          <Button type="submit" colorPalette="purple" size="lg" loading={loading}>Entrar na plataforma</Button>
        </Stack></Box>
        <Box><Text fontSize="sm" color="gray.500" mb="2">Explorar a experiência demonstrativa</Text><Flex gap="3" wrap="wrap"><Button variant="outline" colorPalette="purple" onClick={() => onLogin({ user: getDemoUser("student") })}>Sou estudante</Button><Button variant="outline" colorPalette="orange" onClick={() => onLogin({ user: getDemoUser("teacher") })}>Sou professor</Button></Flex></Box>
      </Stack>
      <Flex className="login-illustration" p="10" direction="column" justify="space-between" minH={{ base: "340px", lg: "620px" }}>
        <Badge alignSelf="start" colorPalette="yellow" variant="solid">APRENDER É UMA AVENTURA</Badge>
        <Box className="rocket"><Text fontSize="7xl">🚀</Text><Box className="orbit orbit-one" /><Box className="orbit orbit-two" /></Box>
        <Box><Heading size="xl">Explore, crie e conquiste</Heading><Text mt="2" opacity=".85">Materiais, desafios e conquistas para cada etapa da sua aprendizagem.</Text></Box>
      </Flex>
    </SimpleGrid>
  </Flex>;
}

function Layout({ user, page, setPage, children, onLogout }) {
  const studentLinks = [["início", "🏠", "Início"], ["materials", "📚", "Materiais"], ["quiz", "🧩", "Provas"]];
  const teacherLinks = [["início", "🏠", "Início"], ["books", "📚", "Livros"], ["classes", "👥", "Turmas"]];
  const links = user.role === "student" ? studentLinks : teacherLinks;
  return <Flex minH="100vh" bg="#f7f8fc">
    <Box as="aside" className="sidebar" w={{ base: "72px", md: "250px" }} p={{ base: "3", md: "6" }}><Logo compact />
      <Stack mt="12" gap="2">{links.map(([key, icon, label]) => <Button key={key} justifyContent={{ base: "center", md: "flex-start" }} variant={page === key ? "solid" : "ghost"} colorPalette="purple" onClick={() => setPage(key)}><Icon>{icon}</Icon><Text display={{ base: "none", md: "block" }}>{label}</Text></Button>)}</Stack>
      <Button mt="auto" variant="ghost" colorPalette="gray" onClick={onLogout}><Icon>↩</Icon><Text display={{ base: "none", md: "block" }}>Sair</Text></Button>
    </Box>
    <Box flex="1" minW="0"><Flex className="topbar" p={{ base: "4", md: "6" }} align="center" justify="space-between"><Text color="gray.500" fontSize="sm">{user.role === "student" ? "Área do estudante" : "Área do professor"}</Text><Flex align="center" gap="3"><Box textAlign="right" display={{ base: "none", sm: "block" }}><Text fontWeight="700">{user.name}</Text><Text color="gray.500" fontSize="xs">{user.role === "student" ? "Estudante" : "Professor"}</Text></Box><Box className="avatar">{user.name[0]}</Box></Flex></Flex>
      <Box px={{ base: "4", md: "7" }} pt="4">
        <Text fontWeight="700">{user.school?.name ?? (user.school_id ? `Escola #${user.school_id}` : "Sem escola vinculada")}</Text>
        {user.school && <Text fontSize="sm" color="gray.600">{user.school.city} · {user.school.state} · Turmas: {getSchoolClasses(user, classes).map((group) => group.name).join(", ") || "Nenhuma turma vinculada"}</Text>}
      </Box>
      <Box p={{ base: "4", md: "7" }} maxW="1400px">{children}</Box>
    </Box>
  </Flex>;
}

function StudentHome({ setPage }) {
  const [category, setCategory] = useState(achievementCategories[0]);
  return <Stack gap="7"><Box className="hero-card"><Box><Badge colorPalette="yellow" variant="solid">NÍVEL 4</Badge><Heading size="2xl" mt="3">Olá, Lia! Pronta para o próximo desafio?</Heading><Text mt="3" opacity=".9">Você já concluiu 17 atividades. Continue explorando para chegar ao nível Expert.</Text><Button mt="5" colorPalette="yellow" variant="solid" onClick={() => setPage("materials")}>Continuar aprendendo</Button></Box><Text className="hero-emoji">👩🏽‍💻</Text></Box>
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="5"><Metric icon="⚡" label="Pontos de desempenho" value="1.840" detail="+120 nesta semana" /><Metric icon="🏆" label="Ranking geral" value="#18" detail="Subiu 4 posições" /><Metric icon="🎯" label="Atividades concluídas" value="17/25" detail="68% do livro ativo" /></SimpleGrid>
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6"><Box className="content-card"><Flex justify="space-between" align="center"><Box><Heading size="lg">Minhas conquistas</Heading><Text color="gray.500" mt="1">Escolha uma categoria para ver seu progresso.</Text></Box><Text fontSize="3xl">🏅</Text></Flex><Flex mt="5" gap="2" wrap="wrap">{achievementCategories.map((item) => <Button key={item} size="sm" variant={category === item ? "solid" : "outline"} colorPalette="purple" onClick={() => setCategory(item)}>{item}</Button>)}</Flex><Flex mt="7" align="center" gap="6"><Box className="badge-medal">⭐</Box><Box flex="1"><Text fontWeight="700">Avançado</Text><Text fontSize="sm" color="gray.500">{category}</Text><Box className="progress-track" mt="3"><Box className="progress-value" w="78%" /></Box><Text mt="2" fontSize="sm">78% concluído · faltam 12% para Expert</Text></Box></Flex></Box>
      <Box className="content-card"><Flex justify="space-between"><Box><Heading size="lg">Ranking</Heading><Text color="gray.500" mt="1">Desempenho em {category.toLowerCase()}.</Text></Box><Text fontSize="3xl">🏆</Text></Flex><Stack mt="5" gap="3">{[["1", "Miguel A.", "2.460"], ["2", "Helena C.", "2.270"], ["18", "Você", "1.840"]].map(([position, name, score]) => <Flex key={name} className={name === "Você" ? "ranking-row current" : "ranking-row"} align="center" justify="space-between"><Flex align="center" gap="3"><Text fontWeight="800" w="6">{position}º</Text><Box className="small-avatar">{name[0]}</Box><Text fontWeight={name === "Você" ? "800" : "600"}>{name}</Text></Flex><Text fontWeight="700">{score} pts</Text></Flex>)}</Stack></Box></SimpleGrid>
    <Box><Flex justify="space-between" align="end" mb="4"><Box><Heading size="lg">Meus livros</Heading><Text color="gray.500">Acesse seus materiais ativos e anteriores.</Text></Box><Button variant="ghost" colorPalette="purple" onClick={() => setPage("materials")}>Ver materiais</Button></Flex><SimpleGrid columns={{ base: 1, md: 2 }} gap="5">{books.map((book) => <BookCard key={book.id} book={book} onClick={() => setPage("materials")} />)}</SimpleGrid></Box>
  </Stack>;
}

function Metric({ icon, label, value, detail }) { return <Box className="metric-card"><Text fontSize="2xl">{icon}</Text><Text fontSize="sm" color="gray.500" mt="2">{label}</Text><Heading size="xl" mt="1">{value}</Heading><Text fontSize="xs" color="green.600" mt="2">{detail}</Text></Box>; }
function BookCard({ book, onClick }) { return <Flex className="book-card" gap="4" onClick={onClick} cursor="pointer"><Flex className="book-cover" bg={book.color}>{book.title.split(" ").map((word) => word[0]).join("")}</Flex><Box flex="1"><Flex justify="space-between" gap="2"><Box><Badge colorPalette={book.active ? "green" : "gray"}>{book.active ? "ATIVO" : "CONCLUÍDO"}</Badge><Heading size="md" mt="2">{book.title}</Heading><Text fontSize="sm" color="gray.500">{book.year}</Text></Box><Text fontSize="xl">📖</Text></Flex><Box className="progress-track" mt="5"><Box className="progress-value" w={`${book.progress}%`} /></Box><Text fontSize="xs" color="gray.500" mt="2">{book.progress}% concluído</Text></Box></Flex>; }

function Materials({ role, setPage }) { return <Stack gap="6"><Box><Heading size="xl">{role === "student" ? "Materiais do livro" : "Livros e materiais de apoio"}</Heading><Text color="gray.500" mt="2">Computação Criativa · 5º ano</Text></Box>{chapters.map((chapter) => <Box className="content-card" key={chapter.number}><Flex align="center" gap="4"><Box className="chapter-number">{chapter.number}</Box><Box><Heading size="md">{chapter.title}</Heading><Text color="gray.500" fontSize="sm">Materiais disponíveis neste capítulo</Text></Box></Flex><SimpleGrid columns={{ base: 1, md: 3 }} gap="3" mt="5">{chapter.materials.map((material) => <Button key={material} minH="76px" h="auto" whiteSpace="normal" textAlign="left" justifyContent="flex-start" variant="outline" colorPalette="purple" onClick={() => material.includes("Prova") ? setPage("quiz") : undefined}>{material.includes("Vídeo") ? "▶️" : material.includes("Jogo") ? "🎮" : material.includes("Prova") ? "🧩" : "📝"} <Text ml="2">{material}</Text></Button>)}</SimpleGrid>{role === "teacher" && <Box className="teacher-note" mt="5"><Text fontWeight="700">Sequência didática sugerida</Text><Text fontSize="sm" mt="1">3 aulas · Apresentar algoritmos, praticar sequências e revisar com o desafio.</Text><Button mt="3" size="sm" colorPalette="orange" onClick={() => setPage("sequence")}>Editar sequência</Button></Box>}</Box>)}</Stack>; }

function TeacherBooks({ setPage }) {
  const teacherBooks = [
    { id: 1, title: "Computação Criativa", year: "5º ano", classes: "5º A e 5º B", color: "#ffb43d" },
    { id: 2, title: "Tecnologia e Inovação", year: "6º ano", classes: "6º A", color: "#35c1a1" },
  ];

  return <Stack gap="6"><Box><Heading size="xl">Meus livros</Heading><Text color="gray.500" mt="2">Selecione um livro para ver seus capítulos e materiais de apoio.</Text></Box><SimpleGrid columns={{ base: 1, md: 2 }} gap="5">{teacherBooks.map((book) => <Flex className="book-card" key={book.id} gap="4" direction="column" onClick={() => setPage("materials")} cursor="pointer"><Flex gap="4"><Flex className="book-cover" bg={book.color}>{book.title.split(" ").map((word) => word[0]).join("")}</Flex><Box flex="1"><Badge colorPalette="green">ATIVO</Badge><Heading size="md" mt="2">{book.title}</Heading><Text color="gray.500" fontSize="sm">{book.year}</Text><Text mt="4" fontSize="sm"><b>Turmas:</b> {book.classes}</Text></Box></Flex><Button alignSelf="start" colorPalette="purple" variant="outline">Ver capítulos e materiais</Button></Flex>)}</SimpleGrid></Stack>;
}

function Quiz({ setPage }) { const [answer, setAnswer] = useState(""); const [done, setDone] = useState(false); return <Box maxW="760px" mx="auto"><Button variant="ghost" onClick={() => setPage("materials")}>← Voltar aos materiais</Button><Box className="content-card" mt="4"><Badge colorPalette="purple">PROVA DE CONHECIMENTO</Badge><Flex justify="space-between" mt="4"><Heading size="lg">Questão 1 de 5</Heading><Text color="gray.500">20% concluído</Text></Flex><Box className="progress-track" mt="4"><Box className="progress-value" w="20%" /></Box>{done ? <Stack align="center" py="10"><Text fontSize="6xl">🎉</Text><Heading>Prova concluída!</Heading><Text color="gray.600">Você acertou 4 de 5 questões e ganhou o badge Avançado.</Text><Flex gap="3"><Button colorPalette="purple" onClick={() => { setDone(false); setAnswer(""); }}>Refazer prova</Button><Button variant="outline" onClick={() => setPage("início")}>Ver conquistas</Button></Flex></Stack> : <Stack mt="8" gap="5"><Heading size="md">Qual é a melhor forma de descrever um algoritmo?</Heading>{["Um conjunto de instruções para resolver um problema", "Um computador muito rápido", "Um tipo de jogo digital", "Uma peça de robótica"].map((item) => <Button key={item} justifyContent="flex-start" h="auto" p="4" whiteSpace="normal" textAlign="left" variant={answer === item ? "solid" : "outline"} colorPalette="purple" onClick={() => setAnswer(item)}>{item}</Button>)}<Button alignSelf="end" colorPalette="purple" disabled={!answer} onClick={() => setDone(true)}>Responder e continuar</Button></Stack>}</Box></Box>; }

function TeacherHome({ setPage }) { return <Stack gap="7"><Box className="teacher-hero"><Box><Badge colorPalette="orange" variant="solid">PAINEL DO PROFESSOR</Badge><Heading size="2xl" mt="3">Acompanhe suas turmas de perto.</Heading><Text mt="3">Veja materiais, organize suas sequências didáticas e acompanhe o progresso das atividades.</Text></Box><Text fontSize="7xl">👨🏻‍🏫</Text></Box><SimpleGrid columns={{ base: 1, md: 3 }} gap="5"><Metric icon="👥" label="Turmas ativas" value="3" detail="84 estudantes" /><Metric icon="📚" label="Livros em uso" value="2" detail="5º e 6º ano" /><Metric icon="✅" label="Média de conclusão" value="74%" detail="+6% neste mês" /></SimpleGrid><Box className="content-card"><Flex justify="space-between" align="center"><Box><Heading size="lg">Turmas ativas</Heading><Text color="gray.500">Acompanhe desempenho e atividades concluídas.</Text></Box><Button colorPalette="purple" onClick={() => setPage("classes")}>Ver turmas</Button></Flex><SimpleGrid columns={{ base: 1, md: 3 }} gap="4" mt="5">{classes.map((group) => <Box key={group.name} className="class-preview"><Text fontWeight="800" fontSize="lg">{group.name}</Text><Text fontSize="sm" color="gray.500">{group.students} estudantes</Text><Text mt="4" fontSize="sm">Média: <b>{group.average}%</b></Text><Box className="progress-track" mt="2"><Box className="progress-value" w={`${group.completion}%`} /></Box></Box>)}</SimpleGrid></Box></Stack>; }

function Classes({ setPage, setSelectedClass }) { return <Stack gap="6"><Box><Heading size="xl">Minhas turmas</Heading><Text color="gray.500" mt="2">Visualize o andamento das atividades por turma.</Text></Box><Box className="content-card overflow-table"><Box as="table" w="full"><Box as="thead"><Box as="tr"><Box as="th">Turma</Box><Box as="th">Estudantes</Box><Box as="th">Conclusão</Box><Box as="th">Média</Box><Box as="th" /></Box></Box><Box as="tbody">{classes.map((group) => <Box as="tr" key={group.name}><Box as="td" fontWeight="800">{group.name}</Box><Box as="td">{group.students}</Box><Box as="td">{group.completion}%</Box><Box as="td">{group.average}%</Box><Box as="td"><Button size="sm" variant="outline" colorPalette="purple" onClick={() => { setSelectedClass(group.name); setPage("performance"); }}>Ver desempenho</Button></Box></Box>)}</Box></Box></Box></Stack>; }

function PerformanceDashboard({ selectedClass, setSelectedClass, setPage }) {
  const [chapter, setChapter] = useState("Todos os capítulos");
  const [student, setStudent] = useState("Todos os estudantes");
  const students = [{ name: "Ana Beatriz", completion: 96, score: 94, attempts: 5, status: "Excelente" }, { name: "Gabriel Lima", completion: 88, score: 86, attempts: 4, status: "Adequado" }, { name: "Isabela Rocha", completion: 74, score: 78, attempts: 3, status: "Atenção" }, { name: "Lucas Martins", completion: 69, score: 71, attempts: 2, status: "Atenção" }, { name: "Marina Alves", completion: 58, score: 62, attempts: 2, status: "Intervenção" }];
  const chapterData = [{ name: "Pensamento computacional", completion: 82, score: 84, proposed: 3 }, { name: "Criando instruções", completion: 76, score: 79, proposed: 3 }, { name: "Programação com blocos", completion: 63, score: 68, proposed: 2 }];
  const activeStudent = student === "Todos os estudantes" ? null : students.find((item) => item.name === student);
  const metrics = activeStudent ? [["Conclusão", `${activeStudent.completion}%`, "Atividades concluídas"], ["Desempenho", `${activeStudent.score}%`, "Média nas provas"], ["Tentativas", activeStudent.attempts, "Provas respondidas"], ["Situação", activeStudent.status, "Acompanhamento pedagógico"]] : [["Conclusão", "74%", "62 de 84 atividades"], ["Média nas provas", "81%", "Acima da meta de 75%"], ["Estudantes ativos", "26", "2 sem acesso recente"], ["Ponto de atenção", "8", "Abaixo de 70% de conclusão"]];
  return <Stack gap="6"><Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap="3"><Box><Button variant="ghost" px="0" onClick={() => setPage("classes")}>← Voltar para turmas</Button><Heading size="xl" mt="2">Desempenho da turma</Heading><Text color="gray.500" mt="1">Acompanhe aprendizagem, participação e necessidades de intervenção.</Text></Box><Badge colorPalette="purple" size="lg">DADOS DEMONSTRATIVOS</Badge></Flex><SimpleGrid columns={{ base: 1, md: 3 }} gap="4"><Filter label="Turma" value={selectedClass} onChange={setSelectedClass} options={classes.map((item) => item.name)} /><Filter label="Capítulo" value={chapter} onChange={setChapter} options={["Todos os capítulos", ...chapterData.map((item) => item.name)]} /><Filter label="Estudante" value={student} onChange={setStudent} options={["Todos os estudantes", ...students.map((item) => item.name)]} /></SimpleGrid><SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="4">{metrics.map(([label, value, detail]) => <Box className="bi-kpi" key={label}><Text color="gray.500" fontSize="sm">{label}</Text><Heading size="xl" mt="2">{value}</Heading><Text color="gray.600" fontSize="sm" mt="2">{detail}</Text></Box>)}</SimpleGrid><SimpleGrid columns={{ base: 1, xl: 2 }} gap="6"><Box className="content-card"><Heading size="md">Desempenho por capítulo</Heading><Text color="gray.500" fontSize="sm" mt="1">Média de acertos e conclusão de atividades.</Text><Stack gap="5" mt="6">{chapterData.map((item) => <Box key={item.name}><Flex justify="space-between" gap="3"><Text fontWeight="700" fontSize="sm">{item.name}</Text><Text fontWeight="800" color="purple.700">{item.score}%</Text></Flex><Box className="bi-bar-track" mt="2"><Box className="bi-bar-score" w={`${item.score}%`} /></Box><Flex justify="space-between" mt="1"><Text fontSize="xs" color="gray.500">{item.completion}% concluído</Text><Text fontSize="xs" color="gray.500">{item.proposed} atividades</Text></Flex></Box>)}</Stack></Box><Box className="content-card"><Heading size="md">Distribuição de desempenho</Heading><Text color="gray.500" fontSize="sm" mt="1">Estudantes por faixa de resultado.</Text><Stack gap="4" mt="6">{[["Acima de 90%", 6, "#35c1a1"], ["De 75% a 89%", 12, "#7158df"], ["De 60% a 74%", 7, "#ffb43d"], ["Abaixo de 60%", 3, "#ef6b60"]].map(([label, value, color]) => <Flex key={label} align="center" gap="3"><Box borderRadius="full" bg={color} h="10px" w="10px" /><Text flex="1" fontSize="sm">{label}</Text><Box className="distribution-track"><Box h="100%" borderRadius="full" bg={color} w={`${Number(value) * 7}%`} /></Box><Text fontWeight="800" w="5">{value}</Text></Flex>)}</Stack><Box className="insight-note" mt="7"><Text fontWeight="800">Leitura rápida</Text><Text fontSize="sm" mt="1">Programação com blocos concentra a menor média e a menor taxa de conclusão. Priorize uma retomada com a turma.</Text></Box></Box></SimpleGrid><Box className="content-card overflow-table"><Heading size="md">Acompanhamento individual</Heading><Text color="gray.500" fontSize="sm" mt="1">Ordenado por desempenho. Selecione um estudante no filtro para focar sua análise.</Text><Box as="table" w="full" mt="5"><Box as="thead"><Box as="tr"><Box as="th">Estudante</Box><Box as="th">Conclusão</Box><Box as="th">Média</Box><Box as="th">Tentativas</Box><Box as="th">Situação</Box></Box></Box><Box as="tbody">{students.filter((item) => !activeStudent || item.name === activeStudent.name).map((item) => <Box as="tr" key={item.name}><Box as="td" fontWeight="800">{item.name}</Box><Box as="td">{item.completion}%</Box><Box as="td">{item.score}%</Box><Box as="td">{item.attempts}</Box><Box as="td"><Badge colorPalette={item.status === "Excelente" ? "green" : item.status === "Adequado" ? "purple" : item.status === "Atenção" ? "orange" : "red"}>{item.status}</Badge></Box></Box>)}</Box></Box></Box></Stack>;
}

function Filter({ label, value, onChange, options }) { return <Box className="filter-card"><Text className="field-label">{label}</Text><Box as="select" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</Box></Box>; }

function Sequence({ setPage }) {
  const [project, setProject] = useState({
    title: "Conhecendo o mundo mágico dos sensores",
    axis: "Pensamento Computacional, Práticas de Programação e Computação, Colaboração, Computadores e dispositivos de comunicação",
    duration: "Trimestre",
    format: "Projeto",
    status: "Pendente",
    ventures: "Monitorando minha planta\nDetectando intrusos\nLigando a luz de maneira autônoma",
    rationale: "Explorar como eletrônica, robótica e sensores podem oferecer informações e modelar comportamentos autônomos em espaços da comunidade escolar.",
    generalObjective: "Montar e programar pequenos circuitos utilizando a plataforma Arduino e sensores.",
    specificObjectives: "Compreender eletrônica e robótica.\nRelacionar sensores, comportamento autônomo e programação.\nMontar circuitos simples e programar o Arduino no mBlock.",
    learningOutcomes: "PC2, PC4, PC7, PCP8, PCP9, PCP10, PCP12, CDC1, CDC3, CDC5, CDC10 e IC8.",
    contents: "Sensores, algoritmos, Arduino, LED, buzzer, protoboard, jumper, resistor, sensores de distância, luminosidade e umidade, sequências, loops e condicionais.",
  });
  const [activities, setActivities] = useState([
    { title: "Falando sobre sensores", description: "Apresentar o tema, discutir o papel dos sensores na robótica, pesquisar tipos de sensores e socializar os resultados." },
    { title: "Organização dos empreendimentos", description: "Explicar a dinâmica da mostra, formar equipes e definir a responsabilidade de cada grupo." },
    { title: "Montagem e programação dos circuitos", description: "Montar circuitos, programar no mBlock e realizar testes de qualidade para cada empreendimento." },
    { title: "Preparação e apresentação", description: "Preparar a apresentação, realizar uma prévia com feedback e apresentar para a comunidade escolar." },
  ]);
  const [saved, setSaved] = useState(false);
  function updateProject(field, value) { setProject({ ...project, [field]: value }); setSaved(false); }
  function updateActivity(index, field, value) { setActivities(activities.map((activity, item) => item === index ? { ...activity, [field]: value } : activity)); setSaved(false); }

  return <Stack maxW="960px" gap="6"><Button alignSelf="start" variant="ghost" onClick={() => setPage("materials")}>← Voltar ao capítulo</Button><Box><Heading size="xl">Sequência didática</Heading><Text color="gray.500" mt="2">Planeje o projeto, seus objetivos e as atividades de cada etapa.</Text></Box><Stack className="content-card" gap="7">
    <Box><Heading size="md">Identificação do projeto</Heading><SimpleGrid columns={{ base: 1, md: 2 }} gap="5" mt="4"><Field label="Título do projeto"><Input value={project.title} onChange={(event) => updateProject("title", event.target.value)} /></Field><Field label="Duração"><Input value={project.duration} onChange={(event) => updateProject("duration", event.target.value)} /></Field><Field label="Modalidade organizativa"><Input value={project.format} onChange={(event) => updateProject("format", event.target.value)} /></Field><Field label="Status"><Input value={project.status} onChange={(event) => updateProject("status", event.target.value)} /></Field></SimpleGrid><Field label="Eixo" mt="5"><Textarea value={project.axis} onChange={(event) => updateProject("axis", event.target.value)} /></Field><Field label="Empreendimentos ou projetos" mt="5"><Textarea value={project.ventures} onChange={(event) => updateProject("ventures", event.target.value)} /></Field></Box>
    <Box><Heading size="md">Fundamentação e objetivos</Heading><Field label="Justificativa" mt="4"><Textarea value={project.rationale} onChange={(event) => updateProject("rationale", event.target.value)} /></Field><Field label="Objetivo geral" mt="5"><Textarea value={project.generalObjective} onChange={(event) => updateProject("generalObjective", event.target.value)} /></Field><Field label="Objetivos específicos" hint="Um objetivo por linha" mt="5"><Textarea value={project.specificObjectives} onChange={(event) => updateProject("specificObjectives", event.target.value)} /></Field></Box>
    <Box><Heading size="md">Aprendizagens e conteúdos</Heading><Field label="Resultados de aprendizagem ou competências" mt="4"><Textarea value={project.learningOutcomes} onChange={(event) => updateProject("learningOutcomes", event.target.value)} /></Field><Field label="Conteúdos" hint="Separe os conteúdos por linha ou vírgula" mt="5"><Textarea value={project.contents} onChange={(event) => updateProject("contents", event.target.value)} /></Field></Box>
    <Box><Heading size="md">Sequência de atividades</Heading><Text color="gray.500" fontSize="sm" mt="1">Registre as orientações para cada momento do projeto.</Text><Stack gap="5" mt="4">{activities.map((activity, index) => <Box key={index} className="activity-editor"><Flex align="center" gap="3" mb="3"><Box className="chapter-number">{index + 1}</Box><Input value={activity.title} onChange={(event) => updateActivity(index, "title", event.target.value)} fontWeight="700" /></Flex><Textarea value={activity.description} onChange={(event) => updateActivity(index, "description", event.target.value)} /></Box>)}</Stack><Button mt="4" variant="outline" onClick={() => setActivities([...activities, { title: "Nova atividade", description: "Descreva como esta atividade será conduzida." }])}>Adicionar atividade</Button></Box>
    <Flex gap="3" justify="end"><Button colorPalette="orange" onClick={() => setSaved(true)}>Salvar sequência</Button></Flex>{saved && <Text color="green.600" fontWeight="700">Sequência didática salva com sucesso.</Text>}
  </Stack></Stack>;
}

function Field({ label, hint, children, ...props }) { return <Box {...props}><Text className="field-label">{label}</Text>{children}{hint && <Text color="gray.500" fontSize="xs" mt="1">{hint}</Text>}</Box>; }

export default function App() { const [session, setSession] = useState(null); const [page, setPage] = useState("início"); const [selectedClass, setSelectedClass] = useState("5º A"); function login(next) { setSession(next); setPage("início"); } if (!session) return <Login onLogin={login} />; const { user } = session; let content; if (page === "materials") content = <Materials role={user.role} setPage={setPage} />; else if (page === "books") content = <TeacherBooks setPage={setPage} />; else if (page === "quiz") content = <Quiz setPage={setPage} />; else if (page === "classes") content = <Classes setPage={setPage} setSelectedClass={setSelectedClass} />; else if (page === "performance") content = <PerformanceDashboard selectedClass={selectedClass} setSelectedClass={setSelectedClass} setPage={setPage} />; else if (page === "sequence") content = <Sequence setPage={setPage} />; else content = user.role === "student" ? <StudentHome setPage={setPage} /> : <TeacherHome setPage={setPage} />; return <Layout user={user} page={page} setPage={setPage} onLogout={() => setSession(null)}>{content}</Layout>; }
