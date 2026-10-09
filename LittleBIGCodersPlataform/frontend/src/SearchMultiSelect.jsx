import React, { useMemo, useState } from "react";
import { Box, Button, Combobox, Flex, Text, createListCollection } from "@chakra-ui/react";

const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function SearchMultiSelect({ label, items, value = [], onChange, filter = () => true }) {
  const [search, setSearch] = useState("");
  const options = items.filter(filter).map(item => ({ value: String(item.id), label: `${item.name ?? item.title}${item.school_name ? ` · ${item.school_name}` : ""}` }));
  const selected = value.map(String);
  const visible = options.filter(item => normalize(item.label).includes(normalize(search.trim())));
  const collection = useMemo(() => createListCollection({ items: visible }), [items, search, filter]);
  const labels = new Map(items.map(item => [String(item.id), `${item.name ?? item.title}${item.school_name ? ` · ${item.school_name}` : ""}`]));
  function remove(id) { onChange(value.filter(item => String(item) !== id)); }
  return <Combobox.Root collection={collection} multiple value={selected} inputValue={search} onInputValueChange={details => setSearch(details.inputValue)} onValueChange={details => onChange(details.value.map(Number))} openOnClick closeOnSelect={false} positioning={{ placement: "bottom-start", sameWidth: true }} onOpenChange={details => { if (!details.open) setSearch(""); }}>
    <Combobox.Label className="field-label">{label}</Combobox.Label>
    {selected.length > 0 && <Flex className="multi-selected" gap="2" wrap="wrap">{selected.map(id => <Flex className="multi-chip" key={id} align="center" gap="1"><Text overflowWrap="anywhere">{labels.get(id) ?? `Item #${id}`}</Text><Button type="button" variant="ghost" size="xs" aria-label={`Remover ${labels.get(id) ?? `item ${id}`}`} onClick={() => remove(id)}>×</Button></Flex>)}</Flex>}
    <Combobox.Control>
      <Combobox.Input placeholder="Buscar e selecionar…" className="multi-search-input" />
      <Combobox.IndicatorGroup><Combobox.Trigger aria-label={`Mostrar opções de ${label}`}><span aria-hidden="true">▾</span></Combobox.Trigger></Combobox.IndicatorGroup>
    </Combobox.Control>
    <Combobox.Positioner zIndex="50"><Combobox.Content className="multi-options">
      {visible.map(item => <Combobox.Item key={item.value} item={item} className="multi-option"><Combobox.ItemText>{item.label}</Combobox.ItemText><Combobox.ItemIndicator>✓</Combobox.ItemIndicator></Combobox.Item>)}
      {!visible.length && <Box p="3" role="status">{options.length ? "Nenhum resultado para esta busca." : "Nenhuma opção disponível."}</Box>}
    </Combobox.Content></Combobox.Positioner>
    <Text fontSize="xs" color="gray.600">{selected.length ? `${selected.length} selecionado(s). Clique em uma opção para marcar ou desmarcar.` : "Busque pelo nome e selecione um ou mais itens."}</Text>
  </Combobox.Root>;
}
