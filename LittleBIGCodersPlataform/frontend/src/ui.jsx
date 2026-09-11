import React, { createContext, useContext, useEffect, useId, useState } from "react";
import { Box, Button, Heading, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";

export const ApiContext = createContext(null);
export const useApi = () => useContext(ApiContext);
export function useResource(path) {
  const api = useApi();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState({ path, revision, loading: true });
    api.request(path, { signal: controller.signal }).then(
      data => { if (!controller.signal.aborted) setState({ path, revision, data }); },
      error => { if (!controller.signal.aborted && error.name !== "AbortError") setState({ path, revision, error: error.message }); },
    );
    return () => controller.abort();
  }, [api, path, revision]);
  const current = state.path === path && state.revision === revision ? state : { loading: Boolean(path) };
  return { ...current, reload: () => setRevision(value => value + 1) };
}
export function Resource({ resource, children }) {
  if (resource.loading) return <Text role="status" p="5">Carregando dados…</Text>;
  if (resource.error) return <Box className="content-card"><Text role="alert" color="red.700">{resource.error}</Text><Button mt="3" onClick={resource.reload}>Tentar novamente</Button></Box>;
  if (resource.data == null) return null;
  return children(resource.data);
}
export function Empty({ children = "Nenhum registro encontrado." }) {
  return <Box className="content-card" color="gray.600" role="status">{children}</Box>;
}
export function Field({ label, children, ...props }) {
  const id = useId();
  return <Box><label className="field-label" htmlFor={id}>{label}</label>{children ? React.cloneElement(children, { id }) : <Input id={id} {...props} />}</Box>;
}
export function Filter({ label, value, onChange, options, all = "Todos", disabled = false }) {
  return <Box className="filter-card"><Field label={label}><select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}><option value="">{all}</option>{options.map(option => <option key={option.id} value={option.id}>{option.name ?? option.title}</option>)}</select></Field></Box>;
}
export const percent = value => value == null ? "—" : `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
export const date = value => value ? new Date(value).toLocaleString("pt-BR") : "—";
export function Metrics({ items }) {
  return <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="4">{items.map(([label, value, detail, icon]) => <Box className="bi-kpi" key={label}><Box className="metric-icon" aria-hidden="true">{icon ?? "📌"}</Box><Text color="gray.600" fontSize="sm" mt="3">{label}</Text><Heading size="2xl" my="2">{value ?? "—"}</Heading>{detail && <Text fontSize="sm" color="gray.500">{detail}</Text>}</Box>)}</SimpleGrid>;
}
export function ReportMetrics({ data }) {
  return <Metrics items={[["Estudantes", data.students, `${data.active_students} com prova concluída`, "🎓"], ["Acertos", percent(data.score), "Todas as tentativas concluídas", "🎯"], ["Conclusão", percent(data.completion), `${data.completed} de ${data.proposed} provas atribuídas`, "✅"], ["Tentativas concluídas", data.attempts, null, "📝"]]} />;
}
export function PageTitle({ title, subtitle, children }) {
  return <Stack gap="2"><Heading size="2xl">{title}</Heading>{subtitle && <Text color="gray.600">{subtitle}</Text>}{children}</Stack>;
}
