import { Dispatch, SetStateAction } from "react"

/**
 * 1. Upload files to S3
 * 2. Gather file text
 * 4. Input said text into OpenAI prompt
 * 5. Ask related questions
 * 6. Generate PDF
 */
export interface StatusObject {
    phase: number,
    progress: number
}

export interface TypeHandler {
    file: FileList | null,
    status: StatusObject
}

export interface Bundle {
    acta_constitutiva: TypeHandler,
    ine: TypeHandler,
    csf: TypeHandler
}

export const updateHandler = (
    dispatch: Dispatch<SetStateAction<Bundle>>,
    field: keyof Bundle,
    category: keyof TypeHandler,
    update: FileList | StatusObject | null,
) => {
    dispatch((prevState: Bundle) => {
        return {
            ...prevState,
            [field]: {
                ...prevState[field],
                [category]: update
            }
        }
    })
}

export const ac = {
    notario: {
        question: "¿Qué notario oficializó el acta?",
        answer: undefined
    },
    empresa: {
        question: "¿Cuál es el nombre de la empresa?",
        answer: undefined
    },
    socios: {
        question: "¿Quienes son los socios?",
        answer: undefined
    },
    lugar: {    
        question: "¿Dónde se oficializó el acta?",
        answer: undefined
    },
    rfc: {
        question: "¿Cuál es el RFC de la empresa?",
        answer: undefined
    },
}

export const csf = {
    notario: {
        question: "¿Qué notario oficializó el acta?",
        answer: undefined
    },
}

export const id = {
    notario: {
        question: "¿Qué notario oficializó el acta?",
        answer: undefined
    },
}