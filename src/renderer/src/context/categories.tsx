import { createContext, FormEvent } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { v4 as uuidv4 } from "uuid";

export type Category = {
  cID: uuidv4;
  name: string;
  questions: Question[];
};

export type Question = {
  qID: uuidv4;
  text: string;
  answer: string;
  hints: string[];
  media: string;
  used: boolean;
  answerRevealed: boolean;
  hintsRevealed: boolean;
};

export type CategoriesContextType = {
  loadQuizData: (url: string) => Promise<void>;
  addCategory: (event: FormEvent) => void;
  deleteCategory: (cID: uuidv4) => void;
  updateCategory: (cID: uuidv4, event: FormEvent) => void;
  addQuestion: (cID: uuidv4) => void;
  updateQuestion: (
    category: string,
    question: string,
    answer: string,
    hints: string[],
    media: string,
    used: boolean,
    event: FormEvent
  ) => void;
  deleteQuestion: (categoryId: number, questionId: number) => void;

  categories: Category[];
};

export const CATEGORIES_CONTEXT = createContext<CategoriesContextType>(null!);

export const CategoriesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "categories",
    []
  );

  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    setCategories([
      ...categories,
      {
        cID: uuidv4(),
        name: data.get("name") as string,
        questions: [],
      },
    ]);
    form.reset();
  };

  const selectCategory = (cID: uuidv4) => {
    useLocalStorage("selectedCategory", cID);
  };

  const selectQuestion = (qID: uuidv4) => {
    useLocalStorage("selectedQuestion", qID);
  };

  const addQuestion = (cID: uuidv4) => {
    const category = categories.find((category) => category.cID === cID);
    if (!category) {
      return;
    }
    const question: Question = {
      qID: uuidv4(),
      text: "",
      answer: "",
      hints: [],
      media: "",
      used: false,
      answerRevealed: false,
      hintsRevealed: false,
    };
    setCategories(
      categories.map((c) =>
        c.cID === cID ? { ...c, questions: [...c.questions, question] } : c
      )
    );
  };

  const loadQuizData = async (data: string) => {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    localStorage.setItem("quizInfo", JSON.stringify(parsedData.quizInfo));
    
    const processedCategories = parsedData.categories.map(category => ({
      ...category,
      cID: uuidv4(),
      questions: category.questions.map(question => ({
        ...question,
        qID: uuidv4(),
        used: false,
        answerRevealed: false,
        hintsRevealed: false
      }))
    }));

    localStorage.setItem("categories", JSON.stringify(processedCategories));
    setCategories(processedCategories);
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category && category.cID === categoryId
          ? { ...category, ...updates }
          : category
      )
    );
  };

  const deleteCategory = (cID: uuidv4) => {
    setCategories(categories.filter((c) => c.cID !== cID));
  };

  const updateQuestion = (cID: number, qID: number, event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    setCategories(
      categories.map((c) =>
        c.cID === cID
          ? {
              ...c,
              questions: c.questions.map((q) =>
                q.qID === qID
                  ? {
                      ...q,
                      text: data.get("name") as string,
                      answer: data.get("answer") as string,
                      hints: data.get("hints") as string[],
                      media: data.get("media") as string,
                      used: data.get("used") as boolean,
                    }
                  : q
              ),
            }
          : c
      )
    );
    form.reset();
  };

  const deleteQuestion = (categoryId: number, questionId: number) => {
    setCategories(
      categories.map((c) =>
        c.cID === categoryId
          ? {
              ...c,
              questions: c.questions.filter((q) => q.qID !== questionId),
            }
          : c
      )
    );
  };

  return (
    <CATEGORIES_CONTEXT.Provider
      value={{
        loadQuizData: loadQuizData,
        addCategory: addCategory,
        deleteCategory: deleteCategory,
        updateCategory: updateCategory,
        addQuestion: addQuestion,
        updateQuestion: updateQuestion,
        deleteQuestion: deleteQuestion,
        categories,
      }}
    >
      {children}
    </CATEGORIES_CONTEXT.Provider>
  );
};
