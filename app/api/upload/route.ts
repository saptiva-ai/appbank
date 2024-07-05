import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {NextRequest, NextResponse} from "next/server";
import {PrismaClient} from "@prisma/client";
import {PDFDocument} from "pdf-lib";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, res: NextResponse) {
  // Recepción de archivos
  const data = await req.formData();
  const file: File | null = data.get("file") as File;

  // Formateo de archivo entrante como búfer para PDF
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);

  // Creación de registro de expediente vacío y extracción de ID correspondiente
  const expedient = await prisma.expedients
    .create({data: {}})
    .then((response) => response.id);

  const document = await prisma.documents.create({
    data: {
      format: file.type.split("/")[1],
      size: file.size,
      type: file.name,
      expedient: expedient,
      data: {
        pages: pdf.getPageCount(),
      },
    },
  });

  await prisma.expedients.update({
    data: {
      documents: {
        push: document.id,
      },
    },
    where: {
      id: expedient,
    },
  });

  // Crear arreglo con info búferes de PDF
  const documentMapper = pdf.getPageIndices().map(async (index) => {
    const newDocument = await PDFDocument.create();
    const [pageBytes] = await newDocument.copyPages(pdf, [index]);

    newDocument.addPage(pageBytes);

    return {
      buffer: await newDocument.save(),
      content: "",
      name: `${expedient}_${file.name}_${index}.pdf`,
    };
  });

  // Recepción del mapeo de documentos, página por página
  const documentMap = await Promise.all(documentMapper);

  // Inicialización de cliente S3
  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  let currentPage = 0;

  const s3Command = new ListBucketsCommand({});
  const Bucket = await s3Client
    .send(s3Command)
    .then((res) => res.Buckets![0].Name);

  console.log("BUCKET::", Bucket);

  const response: any = {
    bucket: Bucket,
    pages: [],
  };

  // Bucle de análisis y recepción de resultados
  const uploadQueue = async () => {
    if (documentMap[currentPage]) {
      // Inicialización de parámetros de envío S3
      const S3UploadParams = {
        Bucket,
        Key: documentMap[currentPage].name,
        Body: documentMap[currentPage].buffer,
      };

      await s3Client.send(new PutObjectCommand(S3UploadParams));

      response.pages.push({
        number: currentPage,
        name: documentMap[currentPage].name,
        id: document.id,
        expedient: document.expedient,
        content: "",
      });

      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve("The promise has been fulfilled");
        }, 250);
      });

      await promise;
      console.log(
        `Se ha añadido a cola la página ${
          currentPage + 1
        } de ${pdf.getPageCount()}`,
      );
      currentPage++;
      await uploadQueue();
    }

    currentPage = 0;
  };

  await uploadQueue();

  prisma.$disconnect;

  return NextResponse.json({...response});
}
