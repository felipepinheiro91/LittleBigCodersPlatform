import React, { useRef, useState } from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { Empty, PageTitle, percent, Resource, useApi, useResource } from "./ui";

export function Quiz({ user, quizId, onBack }) {
  const quiz = useResource(`quizzes/${quizId}/`);
  return <><Button alignSelf="start" variant="ghost" onClick={onBack}>← Voltar</Button><Resource resource={quiz}>{data => <QuizContent key={data.id} quiz={data} student={user.role === "student"} />}</Resource></>;
}

function QuizContent({ quiz, student }) {
  const api = useApi();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function start() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const data = await api.request(`quizzes/${quiz.id}/start/`, { method: "POST" });
      setAttempt(data); setAnswers({}); setPosition(0); setResult(null);
    } catch (reason) { setError(reason.message); }
    finally { pending.current = false; setBusy(false); }
  }
  async function submit() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const data = await api.request(`attempts/${attempt.id}/submit/`, { method: "POST", body: { answers } });
      setResult(data);
    } catch (reason) {
      try {
        const saved = await api.request(`attempts/${attempt.id}/`);
        if (saved.completed) setResult(saved);
        else setError(reason.message);
      } catch { setError(reason.message); }
    } finally { pending.current = false; setBusy(false); }
  }
  const question = quiz.questions[position];
  return <><PageTitle title={quiz.title} subtitle={quiz.description} />{error && <Text role="alert" color="red.700">{error}</Text>}{!quiz.questions.length ? <Empty>Esta prova ainda não possui questões disponíveis.</Empty> : !student ? <Stack gap="4"><Text>Visualização do professor. As respostas corretas não são expostas pela API.</Text>{quiz.questions.map((item, index) => <Box className="content-card" key={item.id}><Heading size="md">{index + 1}. {item.statement}</Heading><Stack mt="3">{item.alternatives.map(alternative => <Text key={alternative.id}>• {alternative.text}</Text>)}</Stack></Box>)}</Stack> : result ? <Box className="content-card"><Stack gap="4"><Heading size="2xl">Prova concluída!</Heading><Text fontSize="2xl">{result.score} de {result.total_questions} acertos · {percent(result.percentage)}</Text><Text>Resultado salvo. Seu desempenho e suas conquistas serão atualizados ao abrir os respectivos painéis.</Text>{result.new_badges?.length > 0 && <Text>🏅 {result.new_badges.length} nova(s) conquista(s)!</Text>}{result.answers?.map(answer => <Box key={answer.question} className="description-box"><Text>{quiz.questions.find(item => item.id === answer.question)?.statement}</Text><Text color={answer.is_correct ? "green.700" : "red.700"}>{answer.is_correct ? "Resposta correta" : "Resposta incorreta"}</Text></Box>)}<Button alignSelf="start" colorPalette="purple" loading={busy} onClick={start}>Tentar novamente</Button></Stack></Box> : !attempt ? <Box className="content-card"><Text mb="4">{quiz.questions.length} questão(ões). A prova só será corrigida após o envio de todas as respostas.</Text><Button colorPalette="purple" loading={busy} onClick={start}>Iniciar prova</Button></Box> : <Box className="content-card"><Stack gap="5"><Text>Questão {position + 1} de {quiz.questions.length}</Text><fieldset disabled={busy}><legend className="question-title">{question.statement}</legend><Stack gap="3" mt="4">{question.alternatives.map(alternative => <label className={`answer-option ${answers[question.id] === alternative.id ? "selected" : ""}`} key={alternative.id}><input type="radio" name={`question-${question.id}`} value={alternative.id} checked={answers[question.id] === alternative.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: alternative.id }))} /><span>{alternative.text}</span></label>)}</Stack></fieldset><Flex gap="3" justify="space-between"><Button variant="outline" disabled={position === 0 || busy} onClick={() => setPosition(value => value - 1)}>Anterior</Button>{position < quiz.questions.length - 1 ? <Button colorPalette="purple" disabled={!answers[question.id]} onClick={() => setPosition(value => value + 1)}>Próxima</Button> : <Button colorPalette="purple" loading={busy} disabled={Object.keys(answers).length !== quiz.questions.length} onClick={submit}>Enviar respostas</Button>}</Flex><Text fontSize="sm" color="gray.600">Se sair antes de enviar, esta tentativa ficará registrada como não concluída.</Text></Stack></Box>}</>;
}
