import { civicsQuestions } from "@/lib/civicsQuestions";
import CivicsTest from "@/components/CivicsTest";

function getRandomQuestions(questions: typeof civicsQuestions, count: number) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function CivicsTestPage() {
  const questions = getRandomQuestions(civicsQuestions, 10);
  
  return <CivicsTest questions={questions} />;
}
