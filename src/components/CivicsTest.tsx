'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useEffect } from "react";
import { CornerDownLeft } from "lucide-react";
import { ArrowTurnDownLeftIcon, CheckCircleIcon, XCircleIcon, ArrowPathRoundedSquareIcon } from "@heroicons/react/16/solid";
import { AnimatePresence, motion } from "framer-motion";

type CivicsQuestion = {
  question: string;
  answers: string[];
};

type Result = {
  question: string;
  userAnswer: string;
  isCorrect: boolean;
  aiReply: string;
  trueAnswers: string[];
};

interface CivicsTestProps {
  questions: CivicsQuestion[];
}

export default function CivicsTest({ questions }: CivicsTestProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<'in-progress' | 'passed' | 'failed'>('in-progress');
  const [grading, setGrading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | null>(null);

  // Focus the input on every render
  useEffect(() => {
    if (!grading) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50); // 100ms delay ensures input is mounted after animation
      return () => clearTimeout(timeout);
    }
  }, [current, grading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGrading(true);

    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[current].question,
          answers: questions[current].answers,
          userAnswer,
        }),
      });
      const data = await res.json();
      setApiStatus(res.ok ? 'ok' : 'error');
      const newCorrectCount = data.isCorrect ? correctCount + 1 : correctCount;
      const newResults = [
          ...results, 
          { 
              question: questions[current].question, 
              userAnswer, isCorrect: data.isCorrect, 
              aiReply: data.aiReply,
              trueAnswers: questions[current].answers
          }
      ];

      // Check for pass/fail
      let newStatus: typeof status = 'in-progress';
      if (newCorrectCount >= 6) newStatus = 'passed';
      else if (current === 9) newStatus = newCorrectCount >= 6 ? 'passed' : 'failed';

      setResults(newResults);
      setCorrectCount(newCorrectCount);
      setUserAnswer('');
      setCurrent(current + 1);
      setStatus(newStatus);
      setGrading(false);
    } catch (err) {
      setApiStatus('error');
      setGrading(false);
    }
  }

  return (
    <>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen w-full p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col max-w-300 w-full gap-[32px] row-start-2 items-center sm:items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => {
                if (inputRef.current && !grading) {
                  inputRef.current.focus();
                }
              }}
              className="flex flex-col w-full gap-2"
            >
              <span className="text-base font-semibold text-neutral-500">
                Question {current + 1} of 10
              </span>
              <div className="flex flex-col gap-8">
                <span className="text-3xl font-medium text-neutral-700">
                  {questions[current]?.question}
                </span>
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex w-full items-center space-x-2">
                    <Input 
                      ref={inputRef}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)} 
                      placeholder="Type your answer here." 
                      required
                      disabled={grading}
                      className="!text-3xl font-medium placeholder:text-neutral-400 w-full border-none shadow-none p-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:ring-0"
                    />
                    <Button 
                      type="submit" 
                      disabled={grading || !userAnswer.trim()}
                      className="!text-3xl text-neutral-500 font-normal bg-transparent shadow-none hover:bg-transparent hover:text-neutral-700 p-0 cursor-pointer"
                    >
                      <CornerDownLeft className="size-8 opacity-50" />
                      {grading ? 'Grading...' : 'Submit'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
        {/* Status light and message at the bottom */}
        <div className="fixed bottom-12 right-12 flex items-center gap-2 z-50">
          <span className={`inline-block w-2 h-2 rounded-full ${apiStatus === 'ok' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'}`}></span>
          <span className="text-sm font-semibold text-neutral-500">
            {apiStatus === 'ok' && 'Model is working correctly'}
            {apiStatus === 'error' && 'Model/API error'}
            {apiStatus === null && 'Model status unknown'}
          </span>
        </div>
      </div>
      <Dialog 
        open={status !== 'in-progress'}
        onOpenChange={(open) => {
          if (!open) {
            window.location.reload();
          }
        }}
      >
        <DialogContent className="lg:max-w-[30vw] max-h-[90vh] p-0 border-none ring-1 ring-neutral-900/10 gap-0">
          <DialogHeader className="px-4 py-6 gap-1">
            <DialogTitle className="flex flex-col gap-2 text-xl font-semibold text-neutral-900">
              {status === 'passed' ? 'Congrats, you passed!' : 'You did not pass'}
            </DialogTitle>
            <DialogDescription className="!font-medium text-neutral-500">
              You answered {correctCount} out of 10 questions correctly.
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-0" />
          <div className="overflow-hidden mt-0">
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 m-w-300 mb-0">
                {results.map((r, i) => (
                  <Accordion key={i} type="single" collapsible>
                    <AccordionItem 
                      value={`item-${i}`}
                      className="py-0 px-4 !border-b-1 hover:bg-neutral-100"
                    >
                      <AccordionTrigger className="py-3 items-center gap no-underline hover:no-underline cursor-pointer">
                        <div className="flex flex-col gap-1 py-0 items-start">
                          <div className="flex items-center gap-2">
                            {r.isCorrect ? (
                              <CheckCircleIcon className="size-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="size-4 text-red-500" />
                            )}
                            <p className="text-neutral-500">Question {i + 1} of 10</p>
                          </div>
                          <p className="font-medium leading-5">{r.question}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 border-1 rounded-lg mb-4">
                        <div className="flex flex-col gap-0 p-2">
                          <p className="text-sm text-neutral-500">Your answer:</p>
                          <p className="font-medium">{r.userAnswer}</p>
                        </div>
                        <Separator className="my-0" />
                        <div className="flex flex-col gap-0 p-2">
                          <p className="text-sm text-neutral-500">Correct answer(s):</p>
                          {r.trueAnswers?.map((answer, idx) => (
                            <p key={idx} className="text-sm font-medium text-neutral-600">{answer}</p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </div>
          </div>
          <Separator className="my-0" />
          <DialogFooter className="px-6 py-6">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => {
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                }}
                className="cursor-pointer w-full"
              >
                <ArrowPathRoundedSquareIcon className="size-5 opacity-40" />
                Run it again
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 