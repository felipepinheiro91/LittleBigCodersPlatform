import React, { useState } from "react";
import { Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import { Empty, Field, PageTitle, Resource, useApi, useResource } from "./ui";

const sections = [
  ["schools", "🏫", "Escolas", "Cadastre a instituição"],
  ["teachers", "👨‍🏫", "Professores", "Vincule docentes à escola"],
  ["students", "🎓", "Estudantes", "Crie acessos dos alunos"],
  ["classes", "👥", "Turmas", "Organize professor e alunos"],
  ["books", "📚", "Livros", "Associe às turmas e docentes"],
  ["chapters", "📖", "Capítulos", "Estruture o conteúdo"],
  ["materials", "🎮", "Materiais", "Adicione vídeos, jogos e provas"],
  ["quizzes", "🧩", "Provas", "Monte questões e alternativas"],
];

export function AdminPanel() {
  const api = useApi();
  const [section, setSection] = useState("schools");
  const [mode, setMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const resources = Object.fromEntries(sections.map(([key]) => [key, useResource(`admin/${key}/`)]));
  const reloadAll = () => Object.values(resources).forEach(resource => resource.reload());
  const active = sections.find(item => item[0] === section);
  function chooseSection(key) { setSection(key); setEditing(null); setSearch(""); setNotice(""); setError(""); }
  async function remove(item) {
    const label = item.name ?? item.title;
    if (!window.confirm(`Remover “${label}”? Esta ação não pode ser desfeita.`)) return;
    setError(""); setNotice("");
    try { await api.request(`admin/${section}/${item.id}/`, { method: "DELETE" }); setEditing(null); setNotice(`${label} foi removido.`); reloadAll(); }
    catch (reason) { setError(reason.message); }
  }
  return <><Box className="admin-hero"><Badge colorPalette="yellow" variant="solid">CENTRAL DE CADASTROS</Badge><Heading size="3xl" mt="3">Prepare a plataforma para sua escola</Heading><Text mt="2">Crie, consulte e mantenha os dados da plataforma em um único lugar.</Text></Box><SimpleGrid className="admin-steps" columns={{ base: 2, md: 4, xl: 8 }} gap="3">{sections.map(([key, icon, label], index) => <button className={`admin-step ${section === key ? "active" : ""}`} key={key} onClick={() => chooseSection(key)}><span>{icon}</span><small>Etapa {index + 1}</small><strong>{label}</strong></button>)}</SimpleGrid><Flex className="admin-mode-switch" gap="2"><Button colorPalette="purple" variant={mode === "create" ? "solid" : "outline"} onClick={() => { setMode("create"); setEditing(null); }}>＋ Criar novo</Button><Button colorPalette="purple" variant={mode === "manage" ? "solid" : "outline"} onClick={() => setMode("manage")}>✏️ Visualizar e editar</Button></Flex>{notice && <Text role="status" color="green.700">✅ {notice}</Text>}{error && <Text role="alert" color="red.700">{error}</Text>}<SimpleGrid columns={{ base: 1, xl: 3 }} gap="5"><Box gridColumn={{ xl: "span 2" }}>{mode === "create" ? <CreateSection section={section} resources={resources} onCreated={() => { reloadAll(); setNotice("Cadastro criado com sucesso."); }} /> : editing ? <CreateSection section={section} resources={resources} editing={editing} onCreated={() => { reloadAll(); setNotice("Alterações salvas com sucesso."); setEditing(null); }} onCancel={() => setEditing(null)} /> : <Box className="content-card"><PageTitle title={`Editar ${active[2].toLowerCase()}`} subtitle="Selecione um cadastro na lista ao lado para abrir o formulário de edição." /><Text fontSize="6xl" mt="8" aria-hidden="true">{active[1]}</Text></Box>}</Box><Box className="content-card"><Heading size="lg">{active[1]} {active[2]} cadastrados</Heading><Text color="gray.600" fontSize="sm" mb="4">{mode === "manage" ? "Pesquise, edite ou remova um registro." : active[3]}</Text>{mode === "manage" && <Input mb="4" placeholder="Buscar por nome ou título" value={search} onChange={event => setSearch(event.target.value)} />}<Resource resource={resources[section]}>{items => { const filtered = items.filter(item => `${item.name ?? item.title} ${item.school_name ?? ""}`.toLowerCase().includes(search.toLowerCase())); return filtered.length ? <Stack gap="2" maxH="580px" overflowY="auto">{filtered.map(item => <Box className={`admin-record ${editing?.id === item.id ? "selected" : ""}`} key={item.id}><Text fontWeight="800">{item.name ?? item.title}</Text><Text fontSize="xs" color="gray.600">#{item.id} {item.school_name ? `· ${item.school_name}` : item.book_title ? `· ${item.book_title}` : item.chapter_title ? `· ${item.chapter_title}` : ""}</Text>{mode === "manage" && <Flex gap="2" mt="3"><Button size="sm" colorPalette="purple" variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button size="sm" colorPalette="red" variant="outline" onClick={() => remove(item)}>Remover</Button></Flex>}</Box>)}</Stack> : <Empty>Nenhum registro encontrado.</Empty>; }}</Resource></Box></SimpleGrid></>;
}

export function AdminOverview({ navigate }) {
  const dashboard = useResource("dashboard/");
  return <><Box className="admin-hero"><Badge colorPalette="yellow" variant="solid">VISÃO EXECUTIVA</Badge><Heading size="3xl" mt="3">Panorama da plataforma</Heading><Text mt="2">Indicadores consolidados de escolas, usuários, conteúdo e aprendizagem.</Text><Button mt="5" onClick={() => navigate("admin")}>Abrir central de cadastros</Button></Box><Resource resource={dashboard}>{data => <><SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap="4">{[["🏫", "Escolas", data.totals.schools], ["👨‍🏫", "Professores", data.totals.teachers], ["🎓", "Estudantes", data.totals.students], ["👥", "Turmas", data.totals.classes], ["📚", "Livros ativos", data.totals.active_books]].map(([icon, label, value]) => <Box className="bi-kpi" key={label}><Box className="metric-icon">{icon}</Box><Text mt="3" color="gray.600">{label}</Text><Heading size="2xl">{value}</Heading></Box>)}</SimpleGrid><SimpleGrid columns={{ base: 1, md: 3 }} gap="4">{[["📖 Estrutura de conteúdo", `${data.totals.chapters} capítulos`, `${data.totals.materials} materiais cadastrados`], ["🧩 Avaliações", data.totals.quizzes, `${data.totals.completed_attempts} tentativas concluídas`], ["✅ Conclusão global", `${data.metrics.completion}%`, `${data.metrics.completed} de ${data.metrics.proposed} provas atribuídas`]].map(([label, value, detail]) => <Box className="content-card" key={label}><Text fontWeight="800">{label}</Text><Heading size="xl" my="2">{value}</Heading><Text color="gray.600">{detail}</Text></Box>)}</SimpleGrid><SimpleGrid columns={{ base: 1, xl: 2 }} gap="5"><AdminBars title="Desempenho por escola" rows={data.schools.map(item => ({ label: item.name, value: item.score, detail: `${item.students} alunos · ${item.classes} turmas` }))} /><AdminBars title="Desempenho por livro" rows={data.books.map(item => ({ label: item.title, value: item.score, detail: `${item.active_students} alunos com prova concluída` }))} /></SimpleGrid><Box className="content-card overflow-table"><Heading size="lg" mb="4">Operação por escola</Heading>{data.schools.length ? <table><thead><tr><th>Escola</th><th>Professores</th><th>Estudantes</th><th>Turmas</th><th>Conclusão</th><th>Acertos</th></tr></thead><tbody>{data.schools.map(school => <tr key={school.id}><td>{school.name}</td><td>{school.teachers}</td><td>{school.students}</td><td>{school.classes}</td><td>{school.completion}%</td><td>{school.score == null ? "—" : `${school.score}%`}</td></tr>)}</tbody></table> : <Empty>Nenhuma escola cadastrada.</Empty>}</Box><Box className="content-card"><Heading size="lg">Evolução recente</Heading><Text color="gray.600" mb="5">Média de acertos nas respostas concluídas nos últimos meses com atividade.</Text>{data.monthly_performance.length ? <Flex className="admin-month-chart" align="end" gap="4">{data.monthly_performance.map(month => <Box key={month.month} flex="1" textAlign="center"><Text fontSize="xs">{month.score == null ? "—" : `${month.score}%`}</Text><Box className="admin-month-bar" h={`${Math.max(8, month.score ?? 0)}px`} /><Text fontSize="xs">{new Date(month.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}</Text></Box>)}</Flex> : <Empty>Ainda não há resultados mensais.</Empty>}</Box></>}</Resource></>;
}

function AdminBars({ title, rows }) {
  return <Box className="content-card"><Heading size="lg" mb="5">{title}</Heading><Stack gap="4">{rows.length ? rows.map(row => <Box key={row.label}><Flex justify="space-between"><Text fontWeight="700">{row.label}</Text><Text>{row.value == null ? "—" : `${row.value}%`}</Text></Flex><Box className="bi-bar-track" mt="2"><Box className="bi-bar-score" w={`${Math.min(100, Math.max(0, row.value ?? 0))}%`} /></Box><Text fontSize="xs" color="gray.600" mt="1">{row.detail}</Text></Box>) : <Text color="gray.600">Sem dados para comparar.</Text>}</Stack></Box>;
}

function CreateSection({ section, resources, onCreated, editing = null, onCancel }) {
  const labels = Object.fromEntries(sections.map(([key, icon, label]) => [key, `${icon} Novo cadastro · ${label}`]));
  const defaults = {
    schools: { name: "", city: "", state: "" },
    teachers: { name: "", login: "", email: "", password: "", school: "" },
    students: { name: "", login: "", email: "", password: "", school: "", grade: "", is_individual_customer: false },
    classes: { name: "", year: new Date().getFullYear(), school: "", teacher: "", student_ids: [] },
    books: { title: "", school_year: "", edition: "", description: "", active: true, teacher_ids: [], class_ids: [], cover_file: null },
    chapters: { book: "", number: 1, title: "", description: "" },
    materials: { chapter: "", title: "", type: "text", url: "", content: "", teacher_only: false, knowledge_areas: [] },
  };
  if (section === "quizzes") return <QuizForm resources={resources} onCreated={onCreated} editing={editing} onCancel={onCancel} />;
  const initial = editing ? { ...defaults[section], ...editing, password: "" } : defaults[section];
  return <BasicForm key={`${section}-${editing?.id ?? "new"}`} title={editing ? `✏️ Editar · ${editing.name ?? editing.title}` : labels[section]} endpoint={`admin/${section}/`} initial={initial} editing={editing} onCreated={onCreated} onCancel={onCancel}>{({ form, set }) => <Fields section={section} form={form} set={set} resources={resources} editing={Boolean(editing)} />}</BasicForm>;
}

function BasicForm({ title, endpoint, initial, editing, onCreated, onCancel, children }) {
  const api = useApi();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      let body = form;
      if (form.cover_file instanceof File) {
        body = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (key === "cover_file" || key === "cover_url" || key === "id") return;
          if (Array.isArray(value)) value.forEach(item => body.append(key, item));
          else body.append(key, typeof value === "boolean" ? String(value) : value ?? "");
        });
        body.append("cover", form.cover_file);
      }
      await api.request(editing ? `${endpoint}${editing.id}/` : endpoint, { method: editing ? "PUT" : "POST", body });
      if (!editing) setForm(initial); setMessage(editing ? "Alterações salvas." : "Cadastro criado com sucesso."); onCreated();
    }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <Box className="content-card admin-form"><Box as="form" onSubmit={submit}><fieldset disabled={busy}><Stack gap="5"><PageTitle title={title} subtitle="Os campos com * são obrigatórios." />{children({ form, set })}{error && <Text role="alert" color="red.700">{error}</Text>}{message && <Text role="status" color="green.700">✅ {message}</Text>}<Flex gap="3"><Button type="submit" colorPalette="purple" size="lg" loading={busy}>{editing ? "Salvar alterações" : "Salvar cadastro"}</Button>{editing && <Button size="lg" variant="ghost" onClick={onCancel}>Cancelar</Button>}</Flex></Stack></fieldset></Box></Box>;
}

function Fields({ section, form, set, resources, editing }) {
  const input = (field, label, props = {}) => <Field label={label} required={props.required} {...props} value={form[field]} onChange={event => set(field, event.target.value)} />;
  const select = (field, label, resource, placeholder, filter = () => true) => <Resource resource={resources[resource]}>{items => <Field label={label}><select required value={form[field]} onChange={event => set(field, event.target.value)}><option value="">{placeholder}</option>{items.filter(filter).map(item => <option key={item.id} value={item.id}>{item.name ?? item.title}</option>)}</select></Field>}</Resource>;
  if (section === "schools") return <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">{input("name", "Nome da escola *", { required: true })}{input("city", "Cidade")}{input("state", "UF", { maxLength: 2 })}</SimpleGrid>;
  if (section === "teachers" || section === "students") return <><SimpleGrid columns={{ base: 1, md: 2 }} gap="4">{input("name", "Nome completo *", { required: true })}{input("login", "Login *", { required: true })}{input("email", "E-mail", { type: "email" })}{input("password", editing ? "Nova senha (deixe vazio para manter)" : "Senha inicial *", { required: !editing, type: "password", minLength: 8 })}{select("school", "Escola *", "schools", "Selecione a escola")}{section === "students" && input("grade", "Ano/série")}</SimpleGrid>{section === "students" && <Check label="Cliente individual" checked={form.is_individual_customer} onChange={value => set("is_individual_customer", value)} />}</>;
  if (section === "classes") return <><SimpleGrid columns={{ base: 1, md: 2 }} gap="4">{input("name", "Nome da turma *", { required: true })}{input("year", "Ano letivo *", { required: true, type: "number", min: 2000 })}{select("school", "Escola *", "schools", "Selecione a escola")}{select("teacher", "Professor *", "teachers", "Selecione o professor", item => !form.school || String(item.school) === String(form.school))}</SimpleGrid><Multi label="Estudantes da turma" items={resources.students.data ?? []} value={form.student_ids} onChange={value => set("student_ids", value)} filter={item => !form.school || String(item.school) === String(form.school)} /></>;
  if (section === "books") return <>{input("title", "Título do livro *", { required: true })}<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">{input("school_year", "Ano escolar *", { required: true })}{input("edition", "Edição")}</SimpleGrid><Field label="Descrição"><Textarea value={form.description} onChange={event => set("description", event.target.value)} /></Field><Field label="Imagem da capa (JPG, PNG ou WebP · até 5 MB)"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => set("cover_file", event.target.files?.[0] ?? null)} /></Field>{form.cover_url && <img className="admin-cover-preview" src={form.cover_url} alt={`Capa atual de ${form.title}`} />}<SimpleGrid columns={{ base: 1, md: 2 }} gap="4"><Multi label="Professores com acesso" items={resources.teachers.data ?? []} value={form.teacher_ids} onChange={value => set("teacher_ids", value)} /><Multi label="Turmas que usarão o livro" items={resources.classes.data ?? []} value={form.class_ids} onChange={value => set("class_ids", value)} /></SimpleGrid><Check label="Livro ativo" checked={form.active} onChange={value => set("active", value)} /></>;
  if (section === "chapters") return <>{select("book", "Livro *", "books", "Selecione o livro")}<SimpleGrid columns={{ base: 1, md: 3 }} gap="4"><Box>{input("number", "Número *", { required: true, type: "number", min: 1 })}</Box><Box gridColumn={{ md: "span 2" }}>{input("title", "Título do capítulo *", { required: true })}</Box></SimpleGrid><Field label="Descrição"><Textarea value={form.description} onChange={event => set("description", event.target.value)} /></Field></>;
  return <>{select("chapter", "Capítulo *", "chapters", "Selecione o capítulo")}{input("title", "Título do material *", { required: true })}<SimpleGrid columns={{ base: 1, md: 2 }} gap="4"><Field label="Tipo"><select value={form.type} onChange={event => set("type", event.target.value)}><option value="text">Leitura</option><option value="video">Vídeo</option><option value="game">Jogo</option><option value="quiz">Prova</option><option value="answer_key">Gabarito</option></select></Field>{input("url", "URL do recurso", { type: "url" })}</SimpleGrid><Field label="Conteúdo / orientações"><Textarea minH="150px" value={form.content} onChange={event => set("content", event.target.value)} /></Field><Check label="Visível somente para professores" checked={form.teacher_only} onChange={value => set("teacher_only", value)} /></>;
}

function Multi({ label, items, value, onChange, filter = () => true }) {
  return <Field label={`${label} (Ctrl para selecionar vários)`}><select multiple size="6" value={value.map(String)} onChange={event => onChange([...event.target.selectedOptions].map(option => Number(option.value)))}>{items.filter(filter).map(item => <option key={item.id} value={item.id}>{item.name ?? item.title}{item.school_name ? ` · ${item.school_name}` : ""}</option>)}</select></Field>;
}
function Check({ label, checked, onChange }) {
  return <label className="admin-check"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /> {label}</label>;
}

function QuizForm({ resources, onCreated, editing, onCancel }) {
  const emptyQuestion = () => ({ statement: "", order: 1, knowledge_area: null, alternatives: [{ text: "", order: 1, is_correct: true }, { text: "", order: 2, is_correct: false }] });
  const initial = editing ? { material: "", title: "", description: "", active: true, questions: [emptyQuestion()], ...editing } : { material: "", title: "", description: "", active: true, questions: [emptyQuestion()] };
  return <BasicForm key={editing?.id ?? "new-quiz"} title={editing ? `✏️ Editar · ${editing.title}` : "🧩 Nova prova"} endpoint="admin/quizzes/" initial={initial} editing={editing} onCreated={onCreated} onCancel={onCancel}>{({ form, set }) => {
    const updateQuestion = (index, updater) => set("questions", form.questions.map((question, position) => position === index ? updater(question) : question));
    return <>{<Resource resource={resources.materials}>{items => <Field label="Material do tipo Prova *"><select required value={form.material} onChange={event => set("material", event.target.value)}><option value="">Selecione o material</option>{items.filter(item => item.type === "quiz").map(item => <option key={item.id} value={item.id}>{item.title} · {item.chapter_title}</option>)}</select></Field>}</Resource>}<Field label="Título da prova *" required value={form.title} onChange={event => set("title", event.target.value)} /><Field label="Orientações"><Textarea value={form.description} onChange={event => set("description", event.target.value)} /></Field>{form.questions.map((question, questionIndex) => <Box className="question-editor" key={questionIndex}><Flex justify="space-between" gap="3"><Heading size="md">Questão {questionIndex + 1}</Heading>{form.questions.length > 1 && <Button size="sm" variant="ghost" onClick={() => set("questions", form.questions.filter((_, index) => index !== questionIndex))}>Remover</Button>}</Flex><Field label="Enunciado *"><Textarea required value={question.statement} onChange={event => updateQuestion(questionIndex, current => ({ ...current, statement: event.target.value }))} /></Field><Text fontWeight="800">Alternativas</Text>{question.alternatives.map((alternative, alternativeIndex) => <Flex key={alternativeIndex} gap="3" align="center"><input aria-label={`Alternativa correta da questão ${questionIndex + 1}`} type="radio" name={`correct-${questionIndex}`} checked={alternative.is_correct} onChange={() => updateQuestion(questionIndex, current => ({ ...current, alternatives: current.alternatives.map((item, index) => ({ ...item, is_correct: index === alternativeIndex })) }))} /><Input required placeholder={`Alternativa ${alternativeIndex + 1}`} value={alternative.text} onChange={event => updateQuestion(questionIndex, current => ({ ...current, alternatives: current.alternatives.map((item, index) => index === alternativeIndex ? { ...item, text: event.target.value } : item) }))} />{question.alternatives.length > 2 && <Button variant="ghost" onClick={() => updateQuestion(questionIndex, current => ({ ...current, alternatives: current.alternatives.filter((_, index) => index !== alternativeIndex) }))}>×</Button>}</Flex>)}<Button variant="outline" alignSelf="start" onClick={() => updateQuestion(questionIndex, current => ({ ...current, alternatives: [...current.alternatives, { text: "", order: current.alternatives.length + 1, is_correct: false }] }))}>Adicionar alternativa</Button></Box>)}<Button variant="outline" onClick={() => set("questions", [...form.questions, { ...emptyQuestion(), order: form.questions.length + 1 }])}>Adicionar questão</Button></>;
  }}</BasicForm>;
}
