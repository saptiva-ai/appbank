import {NextRequest, NextResponse} from "next/server";
import OpenAIApi from "openai";

export async function POST(req: NextRequest, res: NextResponse) {
  const analysisResponses: any[] = await req.json();

  console.log("Analyze: ", analysisResponses);

  let currentPage = 0;

  console.log("OpenAIApi");
  const openai = new OpenAIApi({
    organization: "org-gSi5CFeHGFA1mIu5bVYsO01c",
    apiKey: process.env.OPENAI_API_KEY,
  });

  interface DictumParam {
    question: string;
    answer: string | undefined;
  }

  type Dictum = {
    [key: string]: DictumParam;
  };

  // PENDING: Alterar algoritmo para obtener respuestas a preguntas concisas
  const dictamen: Dictum = {
    rfc: {
      question: "¿Cuál es el RFC de la empresa?",
      answer: undefined,
    },
    estatus: {
      question: "¿Cuál es el estatus en el padrón?",
      answer: undefined,
    },
    actividad: {
      question: "¿Cuál es su actividad económica principal?",
      answer: undefined,
    },
    empresa: {
      question: "¿Cuál es el nombre de la empresa?",
      answer: undefined,
    },
    shareholders: {
      question:
        "¿Quienes son los accionistas de la empresa y qué porcentaje tiene cada uno?",
      answer: undefined,
    },
    representative: {
      question: "¿Quién es el representante legal de la empresa?",
      answer: undefined,
    },
    fecha: {
      question: "¿Cual es la fecha de constitución de la empresa?",
      answer: undefined,
    },
    duracion: {
      question: "¿Cual es la duración de la empresa?",
      answer: undefined,
    },
    folio: {
      question: "¿Cuál es el número de folio mercantil?",
      answer: undefined,
    },
    notario: {
      question: "¿Qué notario oficializó el acta?",
      answer: undefined,
    },
    notaria: {
      question: "¿Dónde se oficializó el acta?",
      answer: undefined,
    },
    comercial: {
      question: "¿Cuál es el domicilio comercial?",
      answer: undefined,
    },
    legal: {
      question: "¿Cuál es el domicilio legal?",
      answer: undefined,
    },
    credito: {
      question: "¿Cuál es su condición crediticia?",
      answer: undefined,
    },
    socios: {
      question: "¿Quienes son los socios?",
      answer: undefined,
    },
    firmantes: {
      question: "¿Quienes son los firmantes?",
      answer: undefined,
    },
  };

  let queries: number = 0;

  const getDocumentResponse = async (prompt: string, question: string) => {
    console.log(`getDocumentResponse: ${question}: ${prompt}`);
    const messages: any = [
      {
        role: "system",
        content: `Eres un agente que se especializa en dictaminar actas constitutivas. Se te dará un texto de una acta constitutiva, una constancia de situación fiscal, o una identificación, el texto de cualquiera de estos tres documentos estará envuelto en tres pares de comillas, algo como: """[texto]""", y tendrás que responder de manera concisa a las preguntas que se te hagan al respecto. Únicamente deberás responder con el dato que se te está solicitando, NI UN CARACTER MÁS, y EN UNA SOLA LINEA. En caso de que no encuentres en el texto provisto una respuesta concreta a la información solicitada, debes responder "N/A".`,
      },
      {
        role: "user",
        content: `En base al siguiente texto: """${prompt}""". Responde la siguiente pregunta: ${question}`,
      },
    ];

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    console.log(
      "ChatCompletion: ",
      JSON.stringify(chatCompletion.choices[0].message),
    );

    return chatCompletion.choices[0].message.content;
  };

  currentPage = 0;
  let currentParam = 0;

  // Checkpoint: Revisar tiempos de iteracion para evitar rate limts.
  const categoryHandler = async () => {
    if (analysisResponses[currentPage]) {
      console.log(`analysisResponse ${currentPage}`);
      const params = Object.keys(dictamen);

      if (currentParam < Object.keys(dictamen).length) {
        if (!dictamen[params[currentParam]].answer) {
          const response = await getDocumentResponse(
            analysisResponses[currentPage].content,
            dictamen[params[currentParam]].question,
          );

          queries++;

          console.log("Queries: ", queries);

          console.log(
            `Página ${currentPage + 1}: - ${
              dictamen[params[currentParam]].question
            }: ${response}`,
          );

          if (response && !response.includes("N/A")) {
            dictamen[params[currentParam]].answer = response;
          }
        }

        currentParam++;

        await categoryHandler();
      } else {
        currentParam = 0;
      }

      currentPage++;

      await categoryHandler();
    }
  };

  await categoryHandler();

  Object.keys(dictamen).forEach((param) => {
    console.log(
      `Dictamen - ${dictamen[param].question}: ${dictamen[param].answer}`,
    );
  });

  return NextResponse.json({...dictamen});
}
