import React, { useState } from "react";
import { Badge, Box, Button, Flex, Heading, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import { endpoint } from "./api";
import { date, Empty, Field, PageTitle, Resource, useApi, useResource } from "./ui";

const textFields = [
  ["axis", "Eixo temático"], ["description", "Descrição do projeto"],
  ["ventures", "Empreendimentos / produto final"], ["rationale", "Justificativa"],
  ["general_objective", "Objetivo geral"], ["specific_objectives", "Objetivos específicos"],
  ["learning_outcomes", "Expectativas de aprendizagem"], ["contents", "Conteúdos"],
];
const blank = { title: "", duration: "", estimated_classes: 1, format: "", status: "pending", activities: [], ...Object.fromEntries(textFields.map(([field]) => [field, ""])) };

export function Sequences({ user, chapter, book, navigate }) {
  const api = useApi();
  const sequences = useResource(endpoint("sequences", { chapter: chapter.id }));
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function copy(sequence) {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api.request(`sequences/${sequence.id}/copy/`, { method: "POST" });
      sequences.reload(); setEditing(result); setNotice("Cópia criada no banco. Você já pode personalizá-la.");
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <><Button alignSelf="start" variant="ghost" onClick={() => navigate("book", { book })}>← Voltar ao livro</Button><PageTitle title="Sequências didáticas" subtitle={`${book.title} · ${chapter.title}`} />{notice && <Text role="status" color="green.700">{notice}</Text>}{error && <Text role="alert" color="red.700">{error}</Text>}{editing ? <SequenceForm key={editing.id ?? "new"} sequence={editing} chapter={chapter.id} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice("Sequência salva no banco de dados."); sequences.reload(); }} /> : <><Button alignSelf="start" colorPalette="purple" onClick={() => { setEditing({ ...blank, activities: [] }); setNotice(""); }}>Nova sequência</Button><Resource resource={sequences}>{items => items.length ? <Stack gap="4">{items.map(sequence => {
    const editable = user.role === "admin" || sequence.teacher === user.teacher_id;
    return <Box key={sequence.id} className="content-card"><Flex justify="space-between" gap="3" wrap="wrap"><Heading size="lg">{sequence.title}</Heading><Badge>{sequence.teacher == null ? "Sugestão" : "Personalizada"} · {sequence.status === "completed" ? "Realizada" : "Pendente"}</Badge></Flex><Text my="3" whiteSpace="pre-wrap">{sequence.description || sequence.general_objective || "Sem descrição."}</Text><Text fontSize="sm" mb="3">{sequence.estimated_classes} aula(s) · {sequence.duration || "Duração não informada"} · Atualizada em {date(sequence.updated_at)}</Text>{editable ? <Button onClick={() => { setEditing(sequence); setNotice(""); }}>Editar sequência</Button> : <Button loading={busy} onClick={() => copy(sequence)}>Copiar sugestão e personalizar</Button>}</Box>;
  })}</Stack> : <Empty>Nenhuma sequência cadastrada neste capítulo. Crie a primeira usando os campos do projeto.</Empty>}</Resource></>}</>;
}

export function SequenceForm({ sequence, chapter, onCancel, onSaved, apiPath = "sequences/", children }) {
  const api = useApi();
  const [form, setForm] = useState({ ...blank, ...sequence });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  function changeActivity(index, field, value) {
    setForm(current => ({ ...current, activities: current.activities.map((activity, position) => position === index ? { ...activity, [field]: value } : activity) }));
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    const payload = Object.fromEntries(Object.keys(blank).map(field => [field, form[field]]));
    try {
      await api.request(sequence.id ? `${apiPath}${sequence.id}/` : apiPath, { method: sequence.id ? "PATCH" : "POST", body: { ...payload, chapter, estimated_classes: Number(form.estimated_classes) } });
      onSaved();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <Box as="form" className="content-card" onSubmit={save}><fieldset disabled={busy}><Stack gap="5"><Heading size="xl">{sequence.id ? "Editar planejamento" : "Novo planejamento"}</Heading>{children}<Field label="Título do projeto" required maxLength={255} value={form.title} onChange={event => set("title", event.target.value)} /><SimpleGrid columns={{ base: 1, md: 2 }} gap="4"><Field label="Duração" maxLength={100} value={form.duration} onChange={event => set("duration", event.target.value)} /><Field label="Quantidade de aulas" type="number" min="1" step="1" required value={form.estimated_classes} onChange={event => set("estimated_classes", event.target.value)} /><Field label="Formato / organização" maxLength={100} value={form.format} onChange={event => set("format", event.target.value)} /><Field label="Situação"><select value={form.status} onChange={event => set("status", event.target.value)}><option value="pending">Pendente</option><option value="completed">Realizada</option></select></Field></SimpleGrid>{textFields.map(([field, label]) => <Field key={field} label={label}><Textarea minH="110px" value={form[field]} onChange={event => set(field, event.target.value)} /></Field>)}<Heading size="lg">Atividades / etapas</Heading>{form.activities.map((activity, index) => <Box key={index} className="description-box"><Stack gap="3"><Field label={`Etapa ${index + 1} — título`} required maxLength={255} value={activity.title} onChange={event => changeActivity(index, "title", event.target.value)} /><Field label={`Etapa ${index + 1} — desenvolvimento e recursos`}><Textarea minH="120px" value={activity.description} onChange={event => changeActivity(index, "description", event.target.value)} /></Field><Button alignSelf="start" type="button" variant="outline" onClick={() => set("activities", form.activities.filter((_, position) => position !== index))}>Remover etapa {index + 1}</Button></Stack></Box>)}<Button type="button" variant="outline" alignSelf="start" onClick={() => set("activities", [...form.activities, { title: "", description: "" }])}>Adicionar etapa</Button>{error && <Text role="alert" color="red.700">{error}</Text>}<Flex gap="3"><Button type="submit" colorPalette="purple" loading={busy}>Salvar sequência</Button>{onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}</Flex></Stack></fieldset></Box>;
}
