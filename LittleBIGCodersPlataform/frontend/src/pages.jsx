import React, { useState } from "react";
import { Badge, Box, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { endpoint } from "./api";
import { VideoMaterial } from "./VideoMaterial";
import { date, Empty, Filter, Metrics, PageTitle, percent, ReportMetrics, Resource, useResource } from "./ui";

const achievementIcons = { participation: "🚀", accuracy: "🎯" };
const areaIcons = ["🧠", "💻", "🤖", "🌐", "🧩", "⚙️", "🎨", "🔬", "✨"];
const levelNames = { zero: "Comece sua jornada", novice: "Iniciante", intermediate: "Intermediário", advanced: "Avançado", expert: "Especialista" };
const levelTargets = { zero: 25, novice: 50, intermediate: 75, advanced: 90, expert: 100 };
function achievementIcon(category, index = 0) {
  return achievementIcons[category.category] ?? areaIcons[index % areaIcons.length];
}
function AchievementShowcase({ categories, compact = false }) {
  const [selected, setSelected] = useState(categories[0]?.category ?? "");
  const active = categories.find(item => item.category === selected) ?? categories[0];
  if (!active) return <Empty>As conquistas aparecerão após as primeiras atividades.</Empty>;
  const activeIndex = categories.findIndex(item => item.category === active.category);
  const target = levelTargets[active.level] ?? 100;
  const remaining = Math.max(0, target - active.percentage);
  return <Box className="achievement-showcase"><Flex align="center" justify="space-between" gap="4"><Box><Heading size={compact ? "lg" : "xl"}>Minhas conquistas</Heading><Text color="gray.600">Escolha uma categoria para ver sua evolução.</Text></Box><Text fontSize="4xl" aria-hidden="true">🏆</Text></Flex><Flex className="achievement-tabs" mt="5" gap="2" wrap="wrap">{categories.map((category, index) => <Button key={category.category} size="sm" variant={active.category === category.category ? "solid" : "outline"} colorPalette="purple" onClick={() => setSelected(category.category)}><Text mr="1" aria-hidden="true">{achievementIcon(category, index)}</Text>{category.name}</Button>)}</Flex><Flex mt="7" align="center" gap={{ base: "4", md: "7" }} direction={{ base: "column", sm: "row" }}><Box className={`achievement-medal level-${active.level}`} aria-label={`Badge ${levelNames[active.level]}`}><span>{achievementIcon(active, activeIndex)}</span><small>★</small></Box><Box flex="1" w="full"><Flex justify="space-between" gap="3"><Box><Text fontWeight="900" fontSize="xl">{levelNames[active.level] ?? active.level}</Text><Text color="gray.600">{active.name}</Text></Box><Text fontWeight="900" color="purple.700" fontSize="xl">{percent(active.percentage)}</Text></Flex><Box className="progress-track achievement-progress" mt="3"><Box className="progress-value" w={`${Math.min(100, Math.max(0, active.percentage))}%`} /></Box><Text mt="2" fontSize="sm" color="gray.600">{active.correct} de {active.total} · {active.level === "expert" ? "nível máximo conquistado" : `faltam ${remaining.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% para o próximo nível`}</Text></Box></Flex></Box>;
}

export function Home({ user, navigate }) {
  const dashboard = useResource("dashboard/");
  const student = user.role === "student";
  return <><Box className={student ? "hero-card" : "teacher-hero"}><Stack>{student && <Badge alignSelf="start" colorPalette="yellow" variant="solid">JORNADA DE CONQUISTAS</Badge>}<Heading size="3xl">Olá, {user.name || user.login}!</Heading><Text>{student ? "Continue aprendendo e construindo suas conquistas." : "Acompanhe sua escola e planeje as próximas descobertas."}</Text><Button alignSelf="start" onClick={() => navigate("books")}>Explorar meus livros</Button></Stack><Box className="hero-emoji" aria-hidden="true" display={{ base: "none", lg: "block" }}>{student ? "👩🏽‍💻" : "👨🏻‍🏫"}</Box></Box><Resource resource={dashboard}>{data => student ? <><Metrics items={[["Livros disponíveis", data.active_books, null, "📚"], ["Pontos acumulados", data.points, "Acertos nas provas concluídas", "⚡"], ["Pontos na semana", data.weekly_points, "Últimos 7 dias", "🌟"], ["Participação", percent(data.categories.find(category => category.category === "participation")?.percentage), null, "🚀"]]} /><AchievementShowcase categories={data.categories} compact /><Heading size="xl">Atividades recentes</Heading><AttemptTable attempts={data.recent_attempts} /></> : <><Metrics items={[["Turmas ativas", data.class_count, "Turmas vinculadas ao seu perfil", "👥"], ["Livros em uso", data.active_books, "Conteúdos disponíveis para suas turmas", "📚"]]} /><ReportMetrics data={data.metrics} /><Button alignSelf="start" colorPalette="purple" onClick={() => navigate("performance")}>Ver desempenho detalhado</Button></>}</Resource></>;
}

export function Books({ navigate }) {
  const books = useResource("books/");
  return <><PageTitle title="Meus livros" subtitle="Livros associados ao seu perfil. Escolha um para explorar os capítulos." /><Resource resource={books}>{items => items.length ? <SimpleGrid columns={{ base: 1, xl: 2 }} gap="5">{items.map(book => <Flex className="book-card" key={book.id} gap="5" align="stretch"><BookCover book={book} /><Stack flex="1" minW="0"><Badge alignSelf="start" colorPalette={book.accessible ? "purple" : "gray"}>{book.school_year}º ano · {book.edition || "Sem edição"}</Badge><Heading size="lg">{book.title}</Heading><Text color="gray.600">{book.description}</Text>{book.progress && <><Text fontSize="sm">Participação: {percent(book.progress.percentage)}</Text><Box className="progress-track"><Box className="progress-value" w={`${Math.min(100, Math.max(0, book.progress.percentage))}%`} /></Box></>}{book.access?.map((access, index) => <Text key={index} fontSize="xs">Acesso: {access.valid_from} até {access.valid_until} · {access.active ? "Ativo" : "Inativo"}</Text>)}<Button colorPalette="purple" disabled={!book.accessible} onClick={() => navigate("book", { book })}>{book.accessible ? "Abrir livro" : "Acesso indisponível"}</Button></Stack></Flex>)}</SimpleGrid> : <Empty>Nenhum livro associado ao seu perfil. Solicite o vínculo à administração da escola.</Empty>}</Resource></>;
}

function BookCover({ book }) {
  return book.cover_url ? <img className="book-cover-image" src={book.cover_url} alt={`Capa do livro ${book.title}`} /> : <Box className="book-cover" bg="purple.600" flexShrink="0" aria-label={`Livro ${book.title} sem capa`}>&lt;/&gt;</Box>;
}

export function Book({ user, book, navigate }) {
  const chapters = useResource(endpoint("chapters", { book: book.id }));
  return <><Button alignSelf="start" variant="ghost" onClick={() => navigate("books")}>← Meus livros</Button><Box className="book-header"><Badge colorPalette="purple">{book.school_year}º ANO · {book.edition || "EDIÇÃO ATUAL"}</Badge><PageTitle title={book.title} subtitle={book.description || "Explore os capítulos e materiais disponíveis."} /></Box><Resource resource={chapters}>{items => items.length ? <Stack gap="5">{items.map(chapter => <Chapter key={chapter.id} chapter={chapter} user={user} book={book} navigate={navigate} />)}</Stack> : <Empty>Este livro ainda não possui capítulos cadastrados.</Empty>}</Resource></>;
}

function Chapter({ chapter, user, book, navigate }) {
  const materials = useResource(endpoint("materials", { chapter: chapter.id }));
  const types = { video: ["▶️", "Vídeo"], game: ["🎮", "Jogo"], text: ["📝", "Leitura"], quiz: ["🧩", "Prova"], answer_key: ["✅", "Gabarito"] };
  return <Box className="chapter-card"><Flex align={{ base: "start", md: "center" }} gap="4" direction={{ base: "column", sm: "row" }}><Box className="chapter-number">{chapter.number}</Box><Box flex="1"><Heading size="lg">{chapter.title}</Heading><Text color="gray.600" fontSize="sm" mt="1">{chapter.description || "Materiais disponíveis neste capítulo"}</Text></Box>{user.role !== "student" && <Button colorPalette="orange" variant="outline" onClick={() => navigate("sequences", { chapter, book })}>🗓️ Sequência didática</Button>}</Flex><Resource resource={materials}>{items => items.length ? <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="3" mt="5">{items.map(material => {
    const [icon, label] = types[material.type] ?? ["📎", material.type];
    const url = safeUrl(material.url);
    return <Box className="material-tile" key={material.id}><Flex className="material-tile-heading" align="center" gap="3"><Box className={`material-icon type-${material.type}`} aria-hidden="true">{icon}</Box><Box minW="0"><Badge colorPalette={material.type === "quiz" ? "purple" : "gray"}>{label}</Badge><Heading size="md" mt="1">{material.title}</Heading></Box></Flex>{material.content && <Text className="material-preview" whiteSpace="pre-wrap">{material.content}</Text>}<Flex gap="2" mt="auto" pt="4" wrap="wrap">{material.type === "video" && material.url ? <VideoMaterial material={material} /> : url && <a className="resource-link" href={url} target="_blank" rel="noopener noreferrer">Abrir {label.toLowerCase()} ↗</a>}{material.quiz_id && <Button colorPalette="purple" onClick={() => navigate("quiz", { quizId: material.quiz_id, book })}>{user.role === "student" ? "Responder prova" : "Visualizar prova"}</Button>}{!material.content && !url && !material.quiz_id && <Text color="gray.600" fontSize="sm">Conteúdo em preparação.</Text>}</Flex></Box>;
  })}</SimpleGrid> : <Box className="chapter-empty" mt="5">Nenhum material disponível neste capítulo.</Box>}</Resource></Box>;
}

function safeUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export function Classes({ navigate }) {
  const classes = useResource("classes/");
  return <><PageTitle title="Minhas turmas" subtitle="Turmas e estudantes vinculados ao seu perfil na escola." /><Resource resource={classes}>{items => items.length ? <Box className="content-card overflow-table"><table><thead><tr><th>Turma</th><th>Escola</th><th>Ano</th><th>Estudantes</th><th>Ação</th></tr></thead><tbody>{items.map(group => <tr key={group.id}><td>{group.name}</td><td>{group.school_name}</td><td>{group.year}</td><td>{group.students_count}</td><td><Button colorPalette="purple" onClick={() => navigate("performance", { classId: String(group.id) })}>Ver desempenho</Button></td></tr>)}</tbody></table></Box> : <Empty>Nenhuma turma vinculada ao seu perfil.</Empty>}</Resource></>;
}

export function Achievements() {
  const achievements = useResource("achievements/");
  const books = useResource("books/");
  const [category, setCategory] = useState("accuracy");
  const [book, setBook] = useState("");
  const ranking = useResource(endpoint("rankings", { category, book }));
  return <><PageTitle title="Conquistas e ranking" subtitle="Evolução calculada a partir das suas respostas reais." /><Resource resource={achievements}>{data => <><AchievementShowcase categories={data.categories} /><Heading size="lg">Badges conquistados</Heading>{data.badges.length ? <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap="4">{data.badges.map((badge, index) => { const badgeCategory = data.categories.find(item => item.category === badge.category) ?? { category: badge.category, name: badge.category }; return <Box className="earned-badge" key={badge.id}><Box className={`achievement-medal mini level-${badge.level}`}><span>{achievementIcon(badgeCategory, index)}</span><small>★</small></Box><Text fontWeight="900" textAlign="center">{badgeCategory.name}</Text><Badge colorPalette="purple">{levelNames[badge.level] ?? badge.level}</Badge><Text fontSize="xs">{date(badge.earned_at)}</Text></Box>; })}</SimpleGrid> : <Empty>Seus badges aparecerão conforme você concluir as provas.</Empty>}<Filter label="Categoria do ranking" value={category} all="Acertos gerais" onChange={value => setCategory(value || "accuracy")} options={data.categories.filter(item => item.category !== "accuracy").map(item => ({ id: item.category, name: item.name }))} /></>}</Resource><Resource resource={books}>{items => <Filter label="Livro do ranking" value={book} onChange={setBook} options={items} all="Todos os livros" />}</Resource><Heading size="xl">Ranking global</Heading><Text fontSize="sm">Participantes de todas as escolas, identificados anonimamente. Os filtros acima se aplicam ao ranking.</Text><Resource resource={ranking}>{data => data.results.length ? <Box className="content-card"><Stack>{data.results.map(row => <Flex className={`ranking-row ${row.is_me ? "current" : ""}`} key={row.student} justify="space-between"><Text>{row.position}. {row.is_me ? "Você" : row.display_name}</Text><Text>{percent(row.percentage)}</Text></Flex>)}</Stack></Box> : <Empty>Ainda não há participantes neste ranking.</Empty>}</Resource></>;
}

export function AttemptTable({ attempts, navigate }) {
  if (!attempts.length) return <Empty>Nenhuma tentativa registrada.</Empty>;
  return <Box className="content-card overflow-table"><table><thead><tr><th>Prova</th><th>Situação</th><th>Resultado</th><th>Data</th>{navigate && <th>Ação</th>}</tr></thead><tbody>{attempts.map(attempt => <tr key={attempt.id}><td>Prova #{attempt.quiz ?? attempt.quiz_id}</td><td>{attempt.completed === false ? "Não concluída" : "Concluída"}</td><td>{attempt.completed === false ? "—" : `${attempt.score}/${attempt.total_questions}`}</td><td>{date(attempt.finished_at ?? attempt.started_at)}</td>{navigate && <td><Button variant="outline" onClick={() => navigate("quiz", { quizId: attempt.quiz })}>Abrir prova</Button></td>}</tr>)}</tbody></table></Box>;
}
export function Attempts({ navigate }) {
  const attempts = useResource("attempts/");
  return <><PageTitle title="Minhas provas" subtitle="Histórico de tentativas. Para iniciar uma prova, abra o material no seu livro." /><Resource resource={attempts}>{items => <AttemptTable attempts={items} navigate={navigate} />}</Resource></>;
}
