import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";
import { writeFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
    const data = await req.json();
    const id = data.pages[0].name.split('_')[0];

    console.log('DATA: ', data);

    interface analysisObject {
        id: string,
        jobid: string,
        status: string,
        content: string,
        confirmation: string | boolean | undefined
    }

    const analysisResponses: analysisObject[] = [];

    // Inicialización de cliente Textract
	const textract = new TextractClient({
		region: process.env.AWS_REGION!,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
		}
	});

    let currentPage = 0;

    const analysisQueue = async() => {
        if (data.pages[currentPage]) {
            const textractCommand = new StartDocumentTextDetectionCommand({
                DocumentLocation: {
                    S3Object: {
                        Bucket: data.bucket,
                        Name: data.pages[currentPage].name
                    }
                }
            });

            const textractResponse = await textract.send(textractCommand);
        
            const JobId = textractResponse.JobId
        
            const response: analysisObject = {
                ...data.pages[currentPage],
                id: data.pages[currentPage].id,
                jobid: JobId!,
                status: '',
                content: '',
                confirmation: undefined
            }
        
            analysisResponses.push(response);

            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('The promise has been fulfilled');
                }, 250);
            });
    
            await promise;
            currentPage++;
            await analysisQueue();
        }

        currentPage = 0;
    }

    await analysisQueue();
    
    // Funcion utilizada para ejecutar en ciclo el mapeo actual
    const completionBucle = async() => {
        if (analysisResponses[currentPage]) {
            const textractCommand = new GetDocumentTextDetectionCommand(
                { JobId: analysisResponses[currentPage].jobid }
            );
    
            const response = await textract.send(textractCommand);

            analysisResponses[currentPage].status = response.JobStatus!;

            /** INE:
             *  Datos personales:
             *      - Nombre
             *      - Segundo nombre
             *      - Apellido paterno
             *      - Apellido paterno
             *      - Fecha de nacimiento
             *      - Nacionalidad
             *      - RFC
             *      - CURP
             *      - Género
             *  - Dirección
             *      - Calle
             *      - Número exterior
             *      - Número interior
             *      - Código postal
             *      - Colonia
             *      - Delegación o municipio
             */

            let output: string = '';
            
            if (analysisResponses[currentPage].status !== 'SUCCEEDED') {
                const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve('The promise has been fulfilled after 1 second');
                    }, 250);
                });

                await promise;
                await completionBucle();
            } else {
                response.Blocks!.forEach((block) => {
                    if (block.BlockType === "WORD") {
                        output = `${output} ${block.Text!}`
                    }
                })

                console.log(`Page ${currentPage}:`, output);
                analysisResponses[currentPage].content = output;
    
                currentPage++;

                const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve('The promise has been fulfilled after 1 second');
                    }, 250);
                });

                await promise;
                await completionBucle();
            }
        }

        currentPage = 0;
    }

    await completionBucle();
    
    return NextResponse.json({ data: analysisResponses })
}